package api

import (
	"context"
	"net/http"
	"time"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/labstack/echo/v4"
)

type UserService interface {
	UserLogin(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error)
	UserRegister(ctx context.Context, req model.RegisterRequest) error
	GetEmailCode(ctx context.Context, req model.GetEmailCodeRequest) error
}

type UserHandler struct {
	userService UserService
}

func NewUserHandler(userService UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// POST /api/login
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

	// Call the user service to log in (Check if user exists and password matches)
	resp, err := h.userService.UserLogin(c.Request().Context(), req)
	// User does not exist or password is incorrect or any other error
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	// Set cookie with the JWT token
	c.SetCookie(&http.Cookie{
		Name:     "token",
		Value:    resp.Token,
		HttpOnly: true,
		Expires:  time.Now().Add(resp.TokenExpiration),
	})

	// Successfully logged in, return the user information (UUID, username, email, and token)
	return c.JSON(http.StatusCreated, resp)
}

// POST /api/register
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
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	// Successfully registered, return a success message
	return c.JSON(http.StatusCreated, map[string]string{
		"message": "User registered successfully",
	})
}

// POST /api/email_code
func (h *UserHandler) GetEmailCode(c echo.Context) error {
	// Extract email from request
	var req model.GetEmailCodeRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Call the user service to get the email code
	err := h.userService.GetEmailCode(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Return the email code status
	return c.JSON(http.StatusCreated, map[string]string{
		"message": "Email code sent successfully",
	})
}
