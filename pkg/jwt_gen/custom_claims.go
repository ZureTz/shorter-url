package jwt_gen

import (
	"github.com/golang-jwt/jwt/v5"
)

type JwtCustomClaims struct {
	UserID string `json:"uid"`
	jwt.RegisteredClaims
}
