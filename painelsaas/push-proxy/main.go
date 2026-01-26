package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/watink/push-proxy/database"
	"github.com/watink/push-proxy/internal/api/handlers"
	"github.com/watink/push-proxy/internal/api/middleware"
	"github.com/watink/push-proxy/services"
	"github.com/watink/push-proxy/workers"
)

func main() {
	// 1. Inicializar Redis
	if err := database.ConnectRedis(); err != nil {
		log.Println("⚠️ Aviso: Redis falhou (Verifique env REDIS_ADDR)")
	}

	// 2. Inicializar RabbitMQ
	if err := services.ConnectQueue(); err != nil {
		log.Fatalf("❌ Erro Crítico: RabbitMQ inacessível: %v", err)
	}
	defer services.CloseQueue()

	// 3. Inicializar Firebase
	services.InitFirebase()

	// 4. Iniciar Worker (Background)
	go workers.StartWorker()

	// 5. Configurar Server HTTP (Fiber)
	app := fiber.New()
	app.Use(logger.New())

	// Rotas
	api := app.Group("/api/v1")
	api.Post("/send", middleware.AuthMiddleware, handlers.SendPush)

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Push Proxy (Producer/Consumer) rodando na porta %s", port)
	log.Fatal(app.Listen(":" + port))
}
