package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/ZureTz/shorter-url/internal/repo"
)

type ShortCodeGenerator interface {
	GenerateShortCode() string
}

type Cacher interface {
	StoreURLToCache(ctx context.Context, urlInfo repo.Url) error
}

type URLService struct {
	querier         repo.Querier
	codeGenerator   ShortCodeGenerator
	cacher          Cacher
	defaultDuration time.Duration
	baseURL         string
}

// CreateURL creates a new shortened URL based on the provided request.
// And returns the response containing the shortened URL and its expiration date.
func (s *URLService) CreateURL(ctx context.Context, req model.CreateURLRequest) (*model.CreateURLResponse, error) {
	var shortCode string
	var isCustom bool
	var expiredAt time.Time

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
	if req.Duration != nil {
		// Calculate the expiration date (now + (*duration) * hours)
		expiredAt = time.Now().Add(time.Duration(*req.Duration) * time.Hour)
	} else {
		// Use the default duration if not provided
		expiredAt = time.Now().Add(s.defaultDuration * time.Hour)
	}

	// Insert into the database
	urlInfo, err := s.querier.CreateURL(ctx, repo.CreateURLParams{
		OriginalUrl: req.OriginalURL,
		ShortCode:   shortCode,
		IsCustom:    isCustom,
		ExpiredAt:   expiredAt,
	})
	if err != nil {
		return nil, err
	}

	// Insert the URL info to the redis cache
	if err := s.cacher.StoreURLToCache(ctx, urlInfo); err != nil {
		return nil, err
	}

	return &model.CreateURLResponse{
		ShortURL:  s.baseURL + urlInfo.ShortCode,
		ExpiredAt: urlInfo.ExpiredAt,
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
