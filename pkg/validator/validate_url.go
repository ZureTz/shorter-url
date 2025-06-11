package validator

import "github.com/go-playground/validator"

// URLValidator validates URLs
type URLValidator struct {
	validator *validator.Validate
}

// NewURLValidator creates a new URLValidator instance
func NewURLValidator() *URLValidator {
	return &URLValidator{validator: validator.New()}
}

// Validate validates the input using the URLValidator
// This is a implementation of the Validator interface
func (uv *URLValidator) Validate(i any) error {
	return uv.validator.Struct(i)
}
