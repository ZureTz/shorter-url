package database

import (
	"database/sql"
	"fmt"

	"github.com/ZureTz/shorter-url/config"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewDB(conf config.DBConfig) (*sql.DB, error) {
	// Get DSN from the configuration
	dsn, err := conf.DataSourceName()
	if err != nil {
		return nil, err
	}

	// Connect to the database using the DSN
	db, err := sql.Open(conf.DriverName, dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to the database: %w", err)
	}

	// Test the database connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping the database: %w", err)
	}

	// Set the maximum number of idle and open connections
	db.SetMaxIdleConns(conf.MaxIdleConns)
	db.SetMaxOpenConns(conf.MaxOpenConns)

	// return the database connection
	return db, nil
}
