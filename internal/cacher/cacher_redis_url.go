package cacher

import (
	"context"
	"encoding/json"

	// "log"
	"time"

	"github.com/ZureTz/shorter-url/internal/repo"
	"github.com/redis/go-redis/v9"
)

const urlKeyPrefix = "url:"

// StoreURLToCache stores the URL information in the cache using redis
func (c *RedisCacher) StoreURLToCache(ctx context.Context, urlInfo repo.Url) error {
	// Stringify the URL information
	stringifiedURLInfo, err := json.Marshal(urlInfo)
	if err != nil {
		return err
	}

	// Generate an expiration time based on the average expiration duration
	expirationDuration := (c.uRLAverageExpiration * 3 / 4) + (time.Duration(time.Now().UnixNano()%int64(c.uRLAverageExpiration)) / 2)
	// Find the minimum between the default expiration duration and the expiration duration in urlInfo (if it exists)
	if urlInfo.ExpiredAt.Valid {
		expirationDuration = min(expirationDuration, urlInfo.ExpiredAt.Time.Sub(time.Now().UTC()))
	}

	// Log the expiration duration for debugging purposes
	// log.Println("Average expiration duration: ", c.averageExpiration)
	// log.Println("Setting expiration duration for URL", urlInfo.ShortCode, ":", expirationDuration)

	// Set the URL information in Redis with an expiration time
	err = c.client.Set(ctx, urlKeyPrefix+urlInfo.ShortCode, stringifiedURLInfo, expirationDuration).Err()
	if err != nil {
		return err
	}

	// Successfully stored the URL information in cache
	return nil
}

// GetURLFromCache retrieves the URL information from the cache using redis
func (c *RedisCacher) GetURLFromCache(ctx context.Context, shortCode string) (*repo.Url, error) {
	// Get the URL information from Redis
	stringifiedURLInfo, err := c.client.Get(ctx, urlKeyPrefix+shortCode).Bytes()
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
