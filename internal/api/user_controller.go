package api

import (
	"context"
	"net/http"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/labstack/echo/v4"
)

type UserService interface {
	UserLogin(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error)
	UserRegister(ctx context.Context, req model.RegisterRequest) error
	GetEmailCode(ctx context.Context, email string) error
}

type UserHandler struct {
	userService UserService
}

func NewUserHandler(userService UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// POST /api/user/login
func (h *UserHandler) UserLogin(c echo.Context) error {
	// Extract parameters from the request
	var req model.LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Validate the parameters (username and password)
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call the user service to log in
	resp, err := h.userService.UserLogin(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Successfully logged in, return the user information (UUID, username, email, and token)
	return c.JSON(http.StatusCreated, resp)
}

// POST /api/user/register
func (h *UserHandler) UserRegister(c echo.Context) error {
	// Extract parameters from the request
	var req model.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Validate the parameters (username, password, email, and email code)
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call the user service to register
	if err := h.userService.UserRegister(c.Request().Context(), req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Successfully registered, return a success message
	return c.JSON(http.StatusCreated, map[string]string{
		"message": "User registered successfully",
	})
}

// GET /api/user/email-code
func (h *UserHandler) GetEmailCode(c echo.Context) error {
	// Extract email from the query parameters
	email := c.QueryParam("email")
	if email == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email is required")
	}

	// Call the user service to get the email code
	err := h.userService.GetEmailCode(c.Request().Context(), email)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Return the email code
	return c.JSON(http.StatusOK, map[string]string{
		"message": "Email code sent successfully",
	})
}
