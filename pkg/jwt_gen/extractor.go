package jwt_gen

import (
	"github.com/ZureTz/shorter-url/config"

	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type JWTExtractor struct {
	secretKey     string
	extractorFunc middleware.ValuesExtractor
}

func NewJWTExtractor(c config.AuthConfig) (*JWTExtractor, error) {
	extractorFunc, err := echojwt.CreateExtractors("cookie:token")
	if err != nil {
		return nil, err
	}

	return &JWTExtractor{
		secretKey:     c.SecretKey,
		extractorFunc: extractorFunc[0],
	}, nil
}

func (e *JWTExtractor) getCustomClaims(ctx echo.Context) (*JwtCustomClaims, error) {
	claimsInString, err := e.extractorFunc(ctx)
	if err != nil {
		return nil, err
	}

	// Get the first firstClaim (there should only be one)
	firstClaim := claimsInString[0]

	// Parse the token
	token, err := jwt.ParseWithClaims(firstClaim, &JwtCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Since we only use the "HS256" signing method, we can safely return the secret key
		return []byte(e.secretKey), nil
	})
	if err != nil {
		return nil, err
	}

	// Extract the claims
	return token.Claims.(*JwtCustomClaims), nil
}

func (e *JWTExtractor) ExtractUserIDFromJWT(ctx echo.Context) (string, error) {
	customClaims, err := e.getCustomClaims(ctx)
	if err != nil {
		return "", err
	}
	return customClaims.UserID, nil
}

func (e *JWTExtractor) ExtractUsernameFromJWT(ctx echo.Context) (string, error) {
	customClaims, err := e.getCustomClaims(ctx)
	if err != nil {
		return "", err
	}
	return customClaims.Username, nil
}
