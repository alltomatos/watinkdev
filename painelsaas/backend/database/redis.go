package database

import (
	"context"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis() {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr: addr,
		DB:   0,
	})

	_, err := RedisClient.Ping(context.Background()).Result()
	if err != nil {
		fmt.Printf("⚠️ Falha ao conectar no Redis (Licenças): %v\n", err)
	} else {
		fmt.Println("✅ Conectado ao Redis (Backend)")
	}
}
