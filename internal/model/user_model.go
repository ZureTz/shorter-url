package model

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type JwtCustomClaims struct {
	UserID int64 `json:"uid"`
	jwt.RegisteredClaims
}

func NewCustomClaims(e echo.Context) jwt.Claims {
	return new(JwtCustomClaims)
}

type LoginRequest struct {
	Username string `json:"username" validate:"required,min=3,max=20,custom_username_validator"`
	Password string `json:"password" validate:"required,min=6,max=50,custom_password_validator"`
}

type LoginResponse struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Token    string `json:"token"`
}

type RegisterRequest struct {
	Username          string `json:"username" validate:"required,min=3,max=20,custom_username_validator"`
	Password          string `json:"password" validate:"required,min=6,max=50,custom_password_validator"`
	ConfirmedPassword string `json:"confirmed_password" validate:"required,eqfield=Password"`
	Email             string `json:"email" validate:"required,email"`
	EmailCode         string `json:"email_code" validate:"required,len=6,numeric"`
}

type GetEmailCodeRequest struct {
	Email string `json:"email" validate:"required,email"`
}