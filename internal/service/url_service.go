package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/ZureTz/shorter-url/config"
	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/ZureTz/shorter-url/internal/repo"
)

type CodeGenerator interface {
	GenerateShortCode() string
}

type URLService struct {
	querier           repo.Querier
	cacher            Cacher
	codeGenerator     CodeGenerator
	defaultExpiration time.Duration
	ShortLinkBaseURL  string
}

// NewURLService creates a new instance of URLService with the provided dependencies
func NewURLService(db *sql.DB, cacher Cacher, codeGenerator CodeGenerator, conf config.URLServiceConfig) *URLService {
	return &URLService{
		querier:           repo.New(db),
		cacher:            cacher,
		codeGenerator:     codeGenerator,
		defaultExpiration: conf.DefaultExpiration,
		ShortLinkBaseURL:  conf.ShortLinkBaseURL,
	}
}

// CreateShortURL creates a new shortened URL based on the provided request
// And returns the response containing the shortened URL and its expiration date
func (s *URLService) CreateShortURL(ctx context.Context, req model.CreateShortURLRequest) (*model.CreateShortURLResponse, error) {
	var shortCode string
	var isCustom bool
	// Check if a custom code is provided
	if req.CustomCode != "" {
		// Check if the custom code is available
		isAvailable, err := s.querier.IsShortCodeAvailable(ctx, req.CustomCode)
		if err != nil {
			return nil, err
		}
		if !isAvailable {
			return nil, fmt.Errorf("custom code %s is already taken", req.CustomCode)
		}
		// Use the custom code
		shortCode = req.CustomCode
		isCustom = true
	} else {
		// Generate a new short code
		generatedShortCode, err := s.tryGenerateShortCode(ctx, 10) // Try up to 10 times
		if err != nil {
			return nil, err
		}

		shortCode = generatedShortCode
		isCustom = false
	}

	// Check if a duration is provided
	var expiredAt time.Time
	if req.Duration != nil {
		// Calculate the expiration date (in days)
		expiredAt = time.Now().UTC().Add(time.Duration(*req.Duration) * time.Hour * 24)
	} else { // Fallback to the default expiration
		// Never expire the URL if default duration is 0
		if s.defaultExpiration == time.Duration(0) {
			// Set to maximum time to never expire
			expiredAt = time.Time{}
		} else { // Otherwise, use the default expiration
			expiredAt = time.Now().UTC().Add(s.defaultExpiration)
		}
	}

	// Insert into the database
	urlInfo, err := s.querier.CreateURL(ctx, repo.CreateURLParams{
		OriginalUrl: req.OriginalURL,
		ShortCode:   shortCode,
		IsCustom:    isCustom,
		ExpiredAt: sql.NullTime{
			Time:  expiredAt,
			Valid: !expiredAt.IsZero(),
		},
		CreatedBy: sql.NullString{
			String: req.CreatedBy,
			Valid:  req.CreatedBy != "",
		},
	})
	if err != nil {
		return nil, err
	}

	// Insert the URL info to the redis cache
	if err := s.cacher.StoreURLToCache(ctx, urlInfo); err != nil {
		return nil, err
	}

	return &model.CreateShortURLResponse{
		ShortURL:  s.ShortLinkBaseURL + "/" + urlInfo.ShortCode,
		ExpiredAt: urlInfo.ExpiredAt.Time,
	}, nil
}

// GetLongURLInfo retrieves the original URL information based on the provided short URL
func (s *URLService) GetLongURLInfo(ctx context.Context, shortCode string) (string, error) {
	// Query the cache first to find if the short URL exists
	originalURLFromCache, err := s.cacher.GetURLFromCache(ctx, shortCode)
	if err != nil {
		return "", err
	}

	// If the URL exists in the cache, return the original URL
	if originalURLFromCache != nil {
		return originalURLFromCache.OriginalUrl, nil
	}

	// Otherwise, query the database
	originalURLFromDB, err := s.querier.GetURLByShortCode(ctx, shortCode)
	if err != nil {
		return "", err
	}

	// Then store the URL info in the cache for future requests
	err = s.cacher.StoreURLToCache(ctx, originalURLFromDB)
	if err != nil {
		return "", err
	}

	// Finally, return the original URL
	return originalURLFromDB.OriginalUrl, nil
}

// Delete outdated URLs from the database
func (s *URLService) DeleteOutdatedURLs(ctx context.Context) error {
	return s.querier.DeleteOutdatedURLs(ctx)
}

// Get URLs created by the user
func (s *URLService) GetMyURLs(ctx context.Context, req model.GetUserShortURLsRequest, username string) (*model.GetUserShortURLsResponse, error) {
	// Retrieve the URLs created by the user from the database
	urls, err := s.querier.GetUserShortURLs(ctx, repo.GetUserShortURLsParams{
		CreatedBy: sql.NullString{
			String: username,
			Valid:  username != "",
		},
		Limit:  int32(req.PerPage),
		Offset: int32((req.Page - 1) * req.PerPage),
	})
	if err != nil {
		return nil, err
	}

	return &model.GetUserShortURLsResponse{
		URLs: urls,
	}, nil
}

// Delete a short URL created by the user
func (s *URLService) DeleteShortURL(ctx context.Context, req model.DeleteUserShortURLRequest, username string) (*model.DeleteUserShortURLResponse, error) {
	// Delete the URL from the database
	err := s.querier.DeleteURLFromId(ctx, repo.DeleteURLFromIdParams{
		ID: req.ID,
		CreatedBy: sql.NullString{
			String: username,
			Valid:  username != "",
		},
	})
	if err != nil {
		return nil, err
	}

	return &model.DeleteUserShortURLResponse{
		Message: "Short URL deleted successfully",
	}, nil
}

// Generate the short code, search for availability
// If available, insert into the database
// Otherwise, generate a new code and repeat
func (s *URLService) tryGenerateShortCode(ctx context.Context, maxTryTimes int) (string, error) {
	if maxTryTimes <= 0 {
		return "", errors.New("cannot generate short code after maximum attempts")
	}

	// Generate a short code using the provided generator
	shortCode := s.codeGenerator.GenerateShortCode()
	// Check if the generated short code is available
	isAvailable, err := s.querier.IsShortCodeAvailable(ctx, shortCode)
	if err != nil {
		return "", err
	}

	// If not available, try again with a reduced attempt count
	if !isAvailable {
		return s.tryGenerateShortCode(ctx, maxTryTimes-1)
	}

	// Otherwise, return the available short code
	return shortCode, nil
}
