package cacher

import (
	"context"
	"time"

	"github.com/ZureTz/shorter-url/config"
	"github.com/redis/go-redis/v9"
)

type RedisCacher struct {
	client               *redis.Client
	uRLAverageExpiration time.Duration
	emailCodeExpiration  time.Duration
}

// NewRedisCacher creates a new Cacher instance with the provided Redis client
func NewRedisCacher(c config.CacherConfig) (*RedisCacher, error) {
	// Create a new Redis client with the provided configuration
	client := redis.NewClient(&redis.Options{
		Addr:     c.CacherURL,
		Password: c.Password, // No password if not set
		DB:       c.DB,       // Use the specified DB
	})

	// Check if the Redis client is able to connect
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	// If successful, return the RedisCacher instance
	return &RedisCacher{
		client:               client,
		uRLAverageExpiration: c.URLAverageExpiration,
		emailCodeExpiration:  c.EmailCodeExpiration,
	}, nil
}

// Close closes the Redis client connection
func (c *RedisCacher) Close() error {
	if c.client == nil {
		return nil
	}
	return c.client.Close()
}
