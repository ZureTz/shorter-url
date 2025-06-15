package service

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/ZureTz/shorter-url/internal/repo"
	"github.com/bwmarrin/snowflake"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	querier repo.Querier
	cacher  Cacher

	secretKey        string
	passwordHashCost int
	snowflakeNode    *snowflake.Node
	jwtExpiration    time.Duration
}

// UserLogin handles user login requests
func (s *UserService) UserLogin(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error) {
	// Get user information from the database
	userInfo, err := s.querier.GetUserInfoFromUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	// Check if the password matches using bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(userInfo.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, err
	}

	// User exists and password matches, generate a JWT token
	claims := &model.JwtCustomClaims{
		UserID: userInfo.UserID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtExpiration)),
		},
	}

	// Generate the JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Get encoded signed token
	tokenString, err := token.SignedString([]byte(s.secretKey))
	if err != nil {
		return nil, err
	}

	// Create the response with user information and token
	resp := &model.LoginResponse{
		UserID:   userInfo.UserID,
		Username: userInfo.Username,
		Email:    userInfo.Email,
		Token:    tokenString,
	}
	return resp, nil
}

func (s *UserService) UserRegister(ctx context.Context, req model.RegisterRequest) error {
	// Validate the email code from cacher
	email, err := s.cacher.GetEmailUsingCode(ctx, req.EmailCode)
	if err != nil {
		return err
	}

	// If email code is nil, it means the code is invalid or expired
	if email == nil {
		return fmt.Errorf("invalid or expired email code")
	}

	// Check if the email matches the one stored in the cacher
	if *email != req.Email {
		return fmt.Errorf("invalid email code")
	}

	// Check if the username or email already exists
	isAvailable, err := s.querier.IsNewUserAvailable(ctx, repo.IsNewUserAvailableParams{
		Username: req.Username,
		Email:    req.Email,
	})
	if err != nil {
		return err
	}
	// If not available, return an error
	if !isAvailable {
		return fmt.Errorf("username or email already exists")
	}

	// If available, hash the password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), s.passwordHashCost)
	if err != nil {
		return err
	}

	// And then generate a new user ID using snowflake
	userID := s.snowflakeNode.Generate().Int64()

	// Create a new user in the database
	newUserInfo := repo.CreateNewUserParams{
		UserID:       userID,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Email:        req.Email,
	}

	err = s.querier.CreateNewUser(ctx, newUserInfo)
	if err != nil {
		return err
	}

	// Successfully registered, now return
	return nil
}

func (s *UserService) GetEmailCode(ctx context.Context, req model.GetEmailCodeRequest) error {
	// Generate a random 6-digit email code
	maxCodeValue := big.NewInt(1000000) // 10^6
	emailCode, err := rand.Int(rand.Reader, maxCodeValue)
	if err != nil {
		return err
	}

	// Send the email code to the user's email address
	// ...

	// Store the email code in the cacher with an expiration time
	err = s.cacher.StoreCodeAndEmail(ctx, emailCode.String(), req.Email)
	if err != nil {
		return err
	}

	// Finally, return nil to indicate success
	return nil
}
