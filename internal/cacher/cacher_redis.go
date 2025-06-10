package cacher

import (
	"context"
	"encoding/json"
	"time"

	"github.com/ZureTz/shorter-url/internal/repo"
	"github.com/redis/go-redis/v9"
)

type RedisCacher struct {
	client            *redis.Client
	averageExpiration time.Duration
}

// NewRedisCacher creates a new Cacher instance with the provided Redis client
func NewRedisCacher(client *redis.Client, averageExpiration time.Duration) *RedisCacher {
	return &RedisCacher{
		client:            client,
		averageExpiration: averageExpiration,
	}
}

// StoreURLToCache stores the URL information in the cache using redis
func (c *RedisCacher) StoreURLToCache(ctx context.Context, urlInfo repo.Url) error {
	// Stringify the URL information
	stringifiedURLInfo, err := json.Marshal(urlInfo)
	if err != nil {
		return err
	}

	// Generate an expiration time based on the average expiration duration
	expirationTime := time.Duration(time.Now().UnixNano() % int64(c.averageExpiration))
	// Set the URL information in Redis with an expiration time
	err = c.client.Set(ctx, urlInfo.ShortCode, stringifiedURLInfo, expirationTime).Err()
	if err != nil {
		return err
	}

	// Successfully stored the URL information in cache
	return nil
}

// GetURLFromCache retrieves the URL information from the cache using redis
func (c *RedisCacher) GetURLFromCache(ctx context.Context, shortCode string) (*repo.Url, error) {
	// Get the URL information from Redis
	stringifiedURLInfo, err := c.client.Get(ctx, shortCode).Bytes()
	// If the key does not exist, return nil
	if err == redis.Nil {
		return nil, nil
	}
	// If there is an error other than key not found, return the error
	if err != nil {
		return nil, err
	}

	// The URL information was found, unmarshal it
	var urlInfo repo.Url
	err = json.Unmarshal([]byte(stringifiedURLInfo), &urlInfo)
	if err != nil {
		return nil, err
	}

	// Return the URL information
	return &urlInfo, nil
}
