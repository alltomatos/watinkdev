package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect() {
	var err error
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=UTC",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_NAME"),
	)

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		panic("Failed to parse DB config: " + err.Error())
	}

	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	DB, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	// Ping to verify
	for i := 0; i < 10; i++ {
		if err := DB.Ping(context.Background()); err == nil {
			fmt.Println("✅ Database Connected (Pool Initialized)")
			return
		}
		fmt.Printf("⚠️ Failed to ping database (attempt %d/10): %v\n", i+1, err)
		time.Sleep(2 * time.Second)
	}
	panic("Failed to ping database after multiple attempts")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
