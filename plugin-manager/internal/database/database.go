package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// Connect establishes a connection to PostgreSQL with retry
func Connect(databaseURL string) (*sql.DB, error) {
	var db *sql.DB
	var err error

	maxRetries := 30
	for i := 0; i < maxRetries; i++ {
		db, err = sql.Open("postgres", databaseURL)
		if err != nil {
			log.Printf("Failed to open db (attempt %d/%d): %v", i+1, maxRetries, err)
			time.Sleep(2 * time.Second)
			continue
		}

		if err = db.Ping(); err == nil {
			log.Println("Successfully connected to database")
			return db, nil
		}

		log.Printf("Failed to ping db (attempt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
}
