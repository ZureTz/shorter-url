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
	// Username/ID is not needed as it will be extracted from JWT
	// Pagination parameters
	Page    int `query:"page" validate:"required,min=1"`
	PerPage int `query:"per_page" validate:"required,min=1,max=1000"`
}

type GetUserShortURLsResponse struct {
	// List of shortened URLs created by the user
	URLs []repo.Url `json:"urls"`
}

type DeleteUserShortURLRequest struct {
	// Id of the shortened URL to be deleted in the database
	ID int64 `json:"id" validate:"required,min=1"`
	// Short code of the URL to be deleted in the cache
	ShortCode string `json:"short_code" validate:"required,alphanum,min=4,max=10"`
}

type DeleteUserShortURLResponse struct {
	// Success message
	Message string `json:"message"`
}
