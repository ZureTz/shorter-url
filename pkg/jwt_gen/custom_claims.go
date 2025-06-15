package jwt_gen

import (
	"github.com/golang-jwt/jwt/v5"
)

type JwtCustomClaims struct {
	UserID int64 `json:"uid"`
	jwt.RegisteredClaims
}
