package api

import (
	"context"
	"net/http"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/labstack/echo/v4"
)

// URLService defines the interface for URL-related operations
type URLService interface {
	CreateShortURL(ctx context.Context, req model.CreateShortURLRequest) (*model.CreateShortURLResponse, error)
	GetLongURLInfo(ctx context.Context, shortURL string) (string, error)
	GetMyURLs(ctx context.Context, req model.GetUserShortURLsRequest, username string) (*model.GetUserShortURLsResponse, error)
	DeleteShortURL(ctx context.Context, req model.DeleteUserShortURLRequest, username string) (*model.DeleteUserShortURLResponse, error)
}

type JWTExtractor interface {
	ExtractUsernameFromJWT(ctx echo.Context) (string, error)
}

type URLHandler struct {
	urlService   URLService
	jwtExtractor JWTExtractor
}

// NewURLHandler creates a new URLHandler with the provided URLService
func NewURLHandler(urlService URLService, jwtExtractor JWTExtractor) *URLHandler {
	return &URLHandler{
		urlService:   urlService,
		jwtExtractor: jwtExtractor,
	}
}

// POST /api/user/url original_url, custom_code, duration -> short_url, expired_at
func (h *URLHandler) CreateShortURL(c echo.Context) error {
	// Extract parameters from the request
	var req model.CreateShortURLRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Validate the parameters (is it a valid URL, is custom_code valid, etc.)
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call the URL service to create the shortened URL
	resp, err := h.urlService.CreateShortURL(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Return the response with the shortened URL and expiration date
	return c.JSON(http.StatusCreated, resp)
}

// GET /:short_code (redirect to original_url)
func (h *URLHandler) RedirectToOriginalURL(c echo.Context) error {
	// Get code from the URL path
	shortcode := c.Param("short_code")

	// Get the original URL from the service using the code
	originalURL, err := h.urlService.GetLongURLInfo(c.Request().Context(), shortcode)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "URL not found")
	}

	// Redirect to the original URL
	return c.Redirect(http.StatusFound, originalURL)
}

// GET /api/user/my_urls
func (h *URLHandler) GetMyURLs(c echo.Context) error {
	// Extract username from the request context
	var req model.GetUserShortURLsRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	// Validate the parameters (is username valid, etc.)
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Get user ID from JWT
	username, err := h.jwtExtractor.ExtractUsernameFromJWT(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call the URL service to get the user's shortened URLs
	urls, err := h.urlService.GetMyURLs(c.Request().Context(), req, username)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Return the list of shortened URLs
	return c.JSON(http.StatusOK, urls)
}

// DELETE /api/user/url
func (h *URLHandler) DeleteShortURL(c echo.Context) error {
	// Extract parameters from the request
	var req model.DeleteUserShortURLRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Validate the parameters
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Get user ID from JWT
	username, err := h.jwtExtractor.ExtractUsernameFromJWT(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call the URL service to delete the shortened URL
	resp, err := h.urlService.DeleteShortURL(c.Request().Context(), req, username)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Return the success message
	return c.JSON(http.StatusOK, resp)
}
