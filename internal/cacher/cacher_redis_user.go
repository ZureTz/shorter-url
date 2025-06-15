package cacher

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// Get email using the email code from Redis
func (c *RedisCacher) GetEmailUsingCode(ctx context.Context, emailCode string) (*string, error) {
	email, err := c.client.Get(ctx, emailCode).Result()
	// Email code not found
	if err == redis.Nil {
		return nil, nil
	}
	// Other error
	if err != nil {
		return nil, err
	}

	// Email code found, return the email
	return &email, nil
}

func (c *RedisCacher) StoreCodeAndEmail(ctx context.Context, emailCode string, email string) error {
	// Store the email code and email in Redis with an expiration time
	err := c.client.Set(ctx, emailCode, email, c.emailCodeExpiration).Err()
	if err != nil {
		return err
	}

	// Successfully stored the email code and email in cache, return nil
	return nil
}
