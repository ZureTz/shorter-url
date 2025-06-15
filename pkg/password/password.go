package password

import (
	"fmt"

	"github.com/ZureTz/shorter-url/config"
	"github.com/bwmarrin/snowflake"
	"golang.org/x/crypto/bcrypt"
)

type PasswordManager struct {
	passwordHashCost int
	snowflakeNode    *snowflake.Node
}

func NewPasswordManager(c config.PasswordManagerConfig) (*PasswordManager, error) {
	// Initialize the snowflake node with the current node number
	node, err := snowflake.NewNode(int64(c.CurrentNodeNumber))
	if err != nil {
		return nil, err
	}

	return &PasswordManager{
		passwordHashCost: c.PasswordHashCost,
		snowflakeNode:    node,
	}, nil
}

func (m *PasswordManager) ValidatePassword(hash string, password string) error {
	// Check if the password matches using bcrypt
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		return fmt.Errorf("your password is incorrect, please try again")
	}
	return nil
}

func (m *PasswordManager) GenerateHashedPassword(password string) (string, error) {
	// Generate a hashed password using bcrypt
	hash, err := bcrypt.GenerateFromPassword([]byte(password), m.passwordHashCost)
	if err != nil {
		return "", fmt.Errorf("failed to generate password hash: %w", err)
	}
	return string(hash), nil
}

func (m *PasswordManager) GenerateUserID() int64 {
	// Generate a unique user ID using snowflake
	return m.snowflakeNode.Generate().Int64()
}
