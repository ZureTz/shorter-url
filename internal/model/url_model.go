package model

import (
	"time"

	"github.com/ZureTz/shorter-url/internal/repo"
)

type CreateShortURLRequest struct {
	// The original URL to be shortened
	OriginalURL string `json:"original_url" validate:"required,http_url"`
	// Custom code for the shortened URL, if provided
	CustomCode string `json:"custom_code,omitempty" validate:"omitempty,alphanum,min=4,max=10"`
	// Duration in hours for which the shortened URL will be valid
	Duration *int `json:"duration,omitempty" validate:"omitempty,min=1,max=720"`
	// Username of the user creating the shortened URL
	CreatedBy string `json:"created_by" validate:"required,min=3,max=20,custom_username_validator"`
}

type CreateShortURLResponse struct {
	// The shortened URL
	ShortURL string `json:"short_url"`
	// The expiration date and time of the shortened URL
	ExpiredAt time.Time `json:"expired_at"`
}

type GetUserShortURLsRequest struct {
	// Username of the user whose shortened URLs are to be retrieved
	Username string `json:"username" validate:"required,min=3,max=20,custom_username_validator"`
	// Pagination parameters
	Page    int `json:"page" validate:"required,min=1"`
	PerPage int `json:"per_page" validate:"required,min=1,max=1000"`
}

type GetUserShortURLsResponse struct {
	// List of shortened URLs created by the user
	URLs []repo.Url `json:"urls"`
}
