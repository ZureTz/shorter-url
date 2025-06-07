package api

import (
	"context"
	"net/http"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/labstack/echo/v4"
)

// URLService defines the interface for URL-related operations.
type URLService interface {
	CreateURL(ctx context.Context, req model.CreateURLRequest) (*model.CreateURLResponse, error) 
}

type URLHandler struct {
	urlService URLService
}

// POST /api/url original_url, custom_code, duration -> short_url, expired_at
func (h *URLHandler) CreateURL(c echo.Context) error{
	// Extract parameters from the request
	var req model.CreateURLRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Validate the parameters (is it a valid URL, is custom_code valid, etc.)
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call the URL service to create the shortened URL
	resp, err := h.urlService.CreateURL(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error()) 
	}

	// Return the response with the shortened URL and expiration date
	return c.JSON(http.StatusCreated, resp)
}

// GET /:short_code (redirect to original_url)


