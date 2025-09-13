package jwt_gen

import (
	"time"

	"github.com/ZureTz/shorter-url/config"
	"github.com/golang-jwt/jwt/v5"
)

type JWTGenerator struct {
	secretKey     string
	jwtExpiration time.Duration
}

func NewJWTGenerator(c config.AuthConfig) *JWTGenerator {
	return &JWTGenerator{
		secretKey:     c.SecretKey,
		jwtExpiration: c.JWTExpiration,
	}
}

func (g *JWTGenerator) GenerateToken(userID, username string) (string, error) {
	// User exists and password matches, generate a JWT token
	claims := &JwtCustomClaims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(g.jwtExpiration)),
		},
	}

	// Generate the JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Get encoded signed token
	tokenString, err := token.SignedString([]byte(g.secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (g *JWTGenerator) GetTokenExpiration() time.Duration {
	return g.jwtExpiration
}
