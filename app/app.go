package app

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ZureTz/shorter-url/config"
	"github.com/ZureTz/shorter-url/database"
	"github.com/ZureTz/shorter-url/internal/api"
	"github.com/ZureTz/shorter-url/internal/cacher"
	"github.com/ZureTz/shorter-url/internal/service"
	"github.com/ZureTz/shorter-url/pkg/jwt_gen"
	"github.com/ZureTz/shorter-url/pkg/mailer"
	"github.com/ZureTz/shorter-url/pkg/password"
	"github.com/ZureTz/shorter-url/pkg/shortcode"
	"github.com/ZureTz/shorter-url/pkg/validator"

	"github.com/golang-jwt/jwt/v5"
	echoJWT "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type App struct {
	e    *echo.Echo
	conf *config.Config

	urlService *service.URLService

	db     *sql.DB
	cacher *cacher.RedisCacher
	mailer *mailer.Mailer
}

func (a *App) Init(filePath string) error {
	// Load configuration
	conf, err := config.LoadConfig(filePath)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	a.conf = conf

	// Initialize database connection
	db, err := database.NewDB(conf.DB)
	if err != nil {
		return err
	}
	a.db = db

	// Initialize Redis cacher
	cacher, err := cacher.NewRedisCacher(conf.Cacher)
	if err != nil {
		return err
	}
	a.cacher = cacher

	// Initialize code generator
	codeGenerator := shortcode.NewShortCodeGenerator(conf.CodeGen.ShortCodeLength)

	// Initialize URL service
	urlService := service.NewURLService(
		db,
		cacher,
		codeGenerator,
		conf.URLService,
	)
	a.urlService = urlService

	// Initialize JWT extractor for URL handler
	jwtExtractor, err := jwt_gen.NewJWTExtractor(conf.Auth)
	if err != nil {
		return err
	}

	// Initialize URL handler
	urlHandler := api.NewURLHandler(urlService, jwtExtractor)

	// Initialize JWT generator and password manager
	jwtGen := jwt_gen.NewJWTGenerator(conf.Auth)
	pwdManager, err := password.NewPasswordManager(conf.PwdManager)
	if err != nil {
		return err
	}

	// Initialize email sender
	a.mailer = mailer.NewMailer(conf.Mailer)

	// Initialize user service and handler
	userService := service.NewUserService(a.db, cacher, jwtGen, pwdManager, a.mailer)
	userHandler := api.NewUserHandler(userService)

	// Initialize Echo web framework
	e := echo.New()

	// Set write and read timeouts
	e.Server.WriteTimeout = conf.Server.WriteTimeout
	e.Server.ReadTimeout = conf.Server.ReadTimeout

	// Use middleware for logging and recovering from panics
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Add request validation middleware
	e.Validator = validator.NewValidator()

	// Register routes
	e.GET("/:short_code", urlHandler.RedirectToOriginalURL)

	// For user and authentication controller
	e.POST("/api/login", userHandler.UserLogin)
	e.POST("/api/register", userHandler.UserRegister)
	e.POST("/api/email_code", userHandler.GetEmailCode)
	e.PUT("/api/reset_password", userHandler.ResetPassword)

	r := e.Group("/api/user")
	// Add JWT middleware for protected routes
	config := echoJWT.Config{
		NewClaimsFunc: func(c echo.Context) jwt.Claims {
			return new(jwt_gen.JwtCustomClaims)
		},
		SigningKey:  []byte(conf.Auth.SecretKey),
		TokenLookup: "cookie:token", // Look for JWT in the cookie named "token"
	}
	r.Use(echoJWT.WithConfig(config))

	// For testing user authentication
	r.GET("/test_auth", userHandler.TestAuth)

	// For url controller
	r.POST("/url", urlHandler.CreateShortURL)

	// For getting user's short URLs
	r.GET("/my_urls", urlHandler.GetMyURLs)

	// Bind the URL handler to the Echo instance
	a.e = e

	return nil
}

// Run the application
func (a *App) Run() {
	// Start the server
	go a.startServer()

	// Start the cleanup routine for outdated URLs
	go a.cleanUp()

	// Handle graceful shutdown
	a.stopServer()
}

func (a *App) startServer() {
	a.e.Logger.Fatal(a.e.Start(fmt.Sprintf(":%d", a.conf.Server.Port)))
}

func (a *App) cleanUp() {
	ticker := time.NewTicker(a.conf.URLService.OutdatedURLCleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		// Perform cleanup of outdated URLs
		if err := a.urlService.DeleteOutdatedURLs(context.Background()); err != nil {
			log.Println(err)
		}
	}
}

func (a *App) stopServer() {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	defer func() {
		if err := a.db.Close(); err != nil {
			log.Printf("Error closing database connection: %v", err)
		}
	}()

	defer func() {
		if err := a.cacher.Close(); err != nil {
			log.Printf("Error closing cacher connection: %v", err)
		}
	}()

	// Close channel to stop the mailer daemon
	defer a.mailer.StopDaemon()

	// Wait for the server to gracefully shut down after finishing all requests
	ctx, cancel := context.WithTimeout(context.Background(), a.conf.Server.GracefulShutdownTimeout)
	defer cancel()

	if err := a.e.Shutdown(ctx); err != nil {
		log.Println(err)
	}
}
