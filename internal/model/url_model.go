package model

import "time"

type CreateURLRequest struct {
	// The original URL to be shortened.
	OriginalURL string `json:"original_url" validate:"required,url"`
	// Custom code for the shortened URL, if provided.
	CustomCode string `json:"custom_code,omitempty" validate:"omitempty,alphanum,min=4,max=10"`
	// Duration in days for which the shortened URL will be valid.
	Duration *int `json:"duration,omitempty" validate:"omitempty,min=1,max=100"`
}

type CreateURLResponse struct {
	// The shortened URL.
	ShortURL string `json:"short_url"`
	// The expiration date and time of the shortened URL.
	ExpiredAt time.Time `json:"expired_at"`
}
