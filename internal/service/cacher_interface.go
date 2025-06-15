package service

import (
	"context"
	"github.com/ZureTz/shorter-url/internal/repo"
)

type Cacher interface {
	// For URL service
	GetURLFromCache(ctx context.Context, shortCode string) (*repo.Url, error)
	StoreURLToCache(ctx context.Context, urlInfo repo.Url) error

	// For User service
	GetEmailUsingCode(ctx context.Context, emailCode string) (*string, error)
	StoreCodeAndEmail(ctx context.Context, emailCode string, email string) error
}
