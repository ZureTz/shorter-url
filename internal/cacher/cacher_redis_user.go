package cacher

import (
	"context"

	"github.com/redis/go-redis/v9"
)

const emailKeyPrefix = "emailCode:"

// Get email using the email code from Redis
func (c *RedisCacher) GetEmailUsingCode(ctx context.Context, emailCode string) (*string, error) {
	email, err := c.client.Get(ctx, emailKeyPrefix+emailCode).Result()
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
	err := c.client.Set(ctx, emailKeyPrefix+emailCode, email, c.emailCodeExpiration).Err()
	if err != nil {
		return err
	}

	// Successfully stored the email code and email in cache, return nil
	return nil
}

// DeleteEmailCode deletes the email code from Redis
func (c *RedisCacher) DeleteEmailCode(ctx context.Context, emailCode string) error {
	err := c.client.Del(ctx, emailKeyPrefix+emailCode).Err()
	// If the key does not exist, return nil
	if err == redis.Nil {
		return nil
	}
	// If there is an error other than key not found, return the error
	if err != nil {
		return err
	}

	// Successfully deleted the email code from cache, return nil
	return nil
}
