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
	"github.com/ZureTz/shorter-url/pkg/password"
	"github.com/ZureTz/shorter-url/pkg/shortcode"
	"github.com/ZureTz/shorter-url/pkg/validator"
	"github.com/golang-jwt/jwt/v5"
	echoJWT "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type App struct {
	e      *echo.Echo
	db     *sql.DB
	cacher *cacher.RedisCacher

	// For generating and handling URLs
	urlHandler    *api.URLHandler
	urlService    *service.URLService
	codeGenerator *shortcode.ShortCodeGenerator

	// For user login and registration
	userHandler *api.UserHandler
	userService *service.UserService

	conf *config.Config
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
	a.codeGenerator = shortcode.NewShortCodeGenerator(conf.CodeGen.ShortCodeLength)

	// Initialize URL service
	a.urlService = service.NewURLService(
		a.db,
		a.cacher,
		a.codeGenerator,
		conf.URLService,
	)

	// Initialize URL handler
	a.urlHandler = api.NewURLHandler(a.urlService)

	// Initialize JWT generator and password manager
	jwtGen := jwt_gen.NewJWTGenerator(conf.Auth)
	pwdManager, err := password.NewPasswordManager(conf.PwdManager)
	if err != nil {
		return err
	}

	// Initialize user service and handler
	a.userService = service.NewUserService(a.db, cacher, jwtGen, pwdManager)
	a.userHandler = api.NewUserHandler(a.userService)

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
	e.GET("/:short_code", a.urlHandler.RedirectToOriginalURL)

	// For user and authentication controller
	e.POST("/api/login", a.userHandler.UserLogin)
	e.POST("/api/register", a.userHandler.UserRegister)
	e.POST("/api/email_code", a.userHandler.GetEmailCode)

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

	// For url controller
	r.POST("/url", a.urlHandler.CreateShortURL)

	// Bind the URL handler to the Echo instance
	a.e = e

	return nil
}

// Run the application
func (a *App) Run() {
	// Start the server
	go a.StartServer()

	// Start the cleanup routine for outdated URLs
	go a.cleanUp()

	// Handle graceful shutdown
	a.StopServer()
}

func (a *App) StartServer() {
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

func (a *App) StopServer() {
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

	// Wait for the server to gracefully shut down after finishing all requests
	ctx, cancel := context.WithTimeout(context.Background(), a.conf.Server.GracefulShutdownTimeout)
	defer cancel()

	if err := a.e.Shutdown(ctx); err != nil {
		log.Println(err)
	}
}
