package validator

import (
	"regexp"

	"github.com/go-playground/validator"
)

// URLValidator validates URLs
type URLValidator struct {
	validator *validator.Validate
}

// NewValidator creates a new URLValidator instance
func NewValidator() *URLValidator {
	v := validator.New()
	v.RegisterValidation("custom_username_validator", CustomUsernameValidator)
	v.RegisterValidation("custom_password_validator", CustomPasswordValidator)
	return &URLValidator{validator: v}
}

// Validate validates the input using the URLValidator
// This is a implementation of the Validator interface
func (uv *URLValidator) Validate(i any) error {
	return uv.validator.Struct(i)
}

// /^[a-zA-Z0-9_]+$/: matches alphanumeric characters and underscores
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

// /^[a-zA-Z0-9_!@#$%^&*]+$/: matches alphanumeric characters, underscores, and special characters
var passwordRegex = regexp.MustCompile(`^[a-zA-Z0-9_!@#$%^&*]+$`)

// Check if the username is valid
func CustomUsernameValidator(fl validator.FieldLevel) bool {
	username := fl.Field().String()
	return usernameRegex.MatchString(username)
}

// Check if the password is valid
func CustomPasswordValidator(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	return passwordRegex.MatchString(password)
}
