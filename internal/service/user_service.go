package service

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/ZureTz/shorter-url/internal/repo"
)

type JWTGenerator interface {
	GenerateToken(userID, username string) (string, error)
	GetTokenExpiration() time.Duration
}

type PasswordManager interface {
	ValidatePassword(hash string, password string) error
	GenerateHashedPassword(password string) (string, error)
	GenerateUserID() string
}

type Mailer interface {
	SendEmail(to string, subject string, body string)
}

type UserService struct {
	querier      repo.Querier
	cacher       Cacher
	jwtGenerator JWTGenerator
	pwdManager   PasswordManager
	mailer       Mailer
}

func NewUserService(db *sql.DB, cacher Cacher, jwtGen JWTGenerator, pwdManager PasswordManager, mailer Mailer) *UserService {
	return &UserService{
		querier:      repo.New(db),
		cacher:       cacher,
		jwtGenerator: jwtGen,
		pwdManager:   pwdManager,
		mailer:       mailer,
	}
}

// UserLogin handles user login requests
func (s *UserService) UserLogin(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error) {
	// Get user information from the database
	userInfo, err := s.querier.GetUserInfoFromUsername(ctx, req.Username)
	if err != nil {
		return nil, fmt.Errorf("invalid username")
	}

	// Check if the password matches using bcrypt
	err = s.pwdManager.ValidatePassword(userInfo.PasswordHash, req.Password)
	if err != nil {
		return nil, fmt.Errorf("your password is incorrect, please try again")
	}

	tokenString, err := s.jwtGenerator.GenerateToken(userInfo.UserID, userInfo.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create the response with user information and token
	resp := &model.LoginResponse{
		UserID:          userInfo.UserID,
		Username:        userInfo.Username,
		Email:           userInfo.Email,
		Token:           tokenString,
		TokenExpiration: s.jwtGenerator.GetTokenExpiration(),
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

	// Code exists, defer deletion of the email code from cacher
	defer func() {
		if err := s.cacher.DeleteEmailCode(ctx, req.EmailCode); err != nil {
			log.Printf("failed to delete email code: %v", err)
		}
	}()

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
	hashedPassword, err := s.pwdManager.GenerateHashedPassword(req.Password)
	if err != nil {
		return err
	}

	// And then generate a new user ID using snowflake
	userID := s.pwdManager.GenerateUserID()

	// Create a new user in the database
	newUserInfo := repo.CreateNewUserParams{
		UserID:       userID,
		Username:     req.Username,
		PasswordHash: hashedPassword,
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
	// Try to generate a unique email code, with a maximum of 10 attempts
	emailCode, err := s.tryGenerateEmailCode(ctx, 10)
	if err != nil {
		return err
	}

	// Query the database to check if the email already exists
	existingUser, err := s.querier.GetUserInfoFromEmail(ctx, req.Email)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	// If the email already exists, add username to the message
	var message string
	if err == nil {
		message += fmt.Sprintf("<p>Hello <b>%s</b>,</p>", existingUser.Username)
	}
	message += fmt.Sprintf("Your email verification code is: %s", *emailCode)

	// Send the email code to the user's email address
	s.mailer.SendEmail(req.Email, "Your Email verification code", message)

	// Store the email code in the cacher with an expiration time
	err = s.cacher.StoreCodeAndEmail(ctx, *emailCode, req.Email)
	if err != nil {
		return err
	}

	// Finally, return nil to indicate success
	return nil
}

// ResetPassword handles the password reset request
func (s *UserService) ResetPassword(ctx context.Context, req model.ResetPasswordRequest) error {
	// Validate the email code from cacher
	email, err := s.cacher.GetEmailUsingCode(ctx, req.EmailCode)
	if err != nil {
		return err
	}

	// If email code is nil, it means the code is invalid or expired
	if email == nil {
		return fmt.Errorf("invalid or expired email code")
	}

	// Code exists, defer deletion of the email code from cacher
	defer func() {
		if err := s.cacher.DeleteEmailCode(ctx, req.EmailCode); err != nil {
			log.Printf("failed to delete email code: %v", err)
		}
	}()

	// Check if the email matches the one stored in the cacher
	if *email != req.Email {
		return fmt.Errorf("invalid email code")
	}

	// Hash the new password using bcrypt
	hashedPassword, err := s.pwdManager.GenerateHashedPassword(req.Password)
	if err != nil {
		return err
	}

	// Execute the password reset in the database
	err = s.querier.ResetUserPassword(ctx, repo.ResetUserPasswordParams{
		Email:        req.Email,
		PasswordHash: hashedPassword,
	})

	if err == sql.ErrNoRows {
		return fmt.Errorf("no user found with the provided email")
	}

	if err != nil {
		return fmt.Errorf("failed to reset password: %w", err)
	}

	// Successfully reset the password, now return nil
	return nil
}

// tryGenerateEmailCode attempts to generate a unique 6-digit email code
// If the code already exists, it will retry up to `tryCount` times
// Returns the generated email code or an error if it fails after multiple attempts
func (s *UserService) tryGenerateEmailCode(ctx context.Context, tryCount int) (*string, error) {
	// Generate a random 6-digit email code
	if tryCount == 0 {
		return nil, fmt.Errorf("failed to generate email code after multiple attempts")
	}

	emailCode := make([]byte, 6)
	for i := range emailCode {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return nil, fmt.Errorf("failed to generate email code: %w", err)
		}
		// Convert the number to a byte and store it in the emailCode slice
		emailCode[i] = '0' + byte(num.Int64())
	}

	// Check if the email code already exists in the cacher
	existingEmail, err := s.cacher.GetEmailUsingCode(ctx, string(emailCode))
	if err != nil {
		return nil, fmt.Errorf("failed to check existing email code: %w", err)
	}

	// If the email code already exists, try generating a new one
	if existingEmail != nil {
		return s.tryGenerateEmailCode(ctx, tryCount-1)
	}

	// If the email code is unique, return it
	emailCodeStr := string(emailCode)
	return &emailCodeStr, nil
}
