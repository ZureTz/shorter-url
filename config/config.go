package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type DBConfig struct {
	DriverName   string `mapstructure:"driver_name"`
	DatabaseHost string `mapstructure:"database_host"`
	DatabasePort int    `mapstructure:"database_port"`
	DatabaseName string `mapstructure:"database_name"`
	Username     string `mapstructure:"username"`
	Password     string `mapstructure:"password"`
	SSLMode      string `mapstructure:"ssl_mode"`
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
}

// Generate a data source name (DSN) for the database connection
func (c *DBConfig) DataSourceName() (string, error) {
	var protocol string
	switch c.DriverName {
	case "pgx":
		protocol = "postgres"
	default:
		return "", fmt.Errorf("unsupported driver name: %s", c.DriverName)
	}

	return fmt.Sprintf("%s://%s:%s@%s:%d/%s?sslmode=%s",
		protocol,
		c.Username,
		c.Password,
		c.DatabaseHost,
		c.DatabasePort,
		c.DatabaseName,
		c.SSLMode,
	), nil
}

type CacherConfig struct {
	CacherURL         string        `mapstructure:"cacher_url"`
	Password          string        `mapstructure:"password"`
	DB                int           `mapstructure:"db"`
	AverageExpiration time.Duration `mapstructure:"average_expiration"`
}

type CodeGeneratorConfig struct {
	ShortCodeLength int `mapstructure:"short_code_length"`
}

type URLServiceConfig struct {
	ShortLinkBaseURL           string        `mapstructure:"short_link_base_url"`
	DefaultExpiration          time.Duration `mapstructure:"default_expiration"`
	OutdatedURLCleanupInterval time.Duration `mapstructure:"outdated_url_cleanup_interval"`
}

type UserServiceConfig struct {
	EmailCodeExpiration time.Duration `mapstructure:"email_code_expiration"`
}

type ServerConfig struct {
	Port                    int           `mapstructure:"port"`
	WriteTimeout            time.Duration `mapstructure:"write_timeout"`
	ReadTimeout             time.Duration `mapstructure:"read_timeout"`
	GracefulShutdownTimeout time.Duration `mapstructure:"graceful_shutdown_timeout"`
}

type AuthConfig struct {
	SecretKey  string        `mapstructure:"secret_key"`
	Expiration time.Duration `mapstructure:"expiration"`
}

type Config struct {
	DB          DBConfig            `mapstructure:"db"`
	Cacher      CacherConfig        `mapstructure:"cacher"`
	CodeGen     CodeGeneratorConfig `mapstructure:"code_generator"`
	URLService  URLServiceConfig    `mapstructure:"url_service"`
	UserService UserServiceConfig   `mapstructure:"user_service"`
	Auth        AuthConfig          `mapstructure:"auth"`
	Server      ServerConfig        `mapstructure:"server"`
}

// LoadConfig loads the configuration from a file using viper
func LoadConfig(filePath string) (*Config, error) {
	viper.SetConfigFile(filePath)
	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, err
	}

	return &config, nil
}
