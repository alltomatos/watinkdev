package main

import (
	"log"
	"watink-guard/internal/api/middleware"
	"watink-guard/internal/handlers"
	"watink-guard/internal/infra"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	infra.ConnectDB()
	infra.ConnectRabbitMQ()

	// Auto-migrate the Tenant model
	// Ensure the table exists and has the columns
	// Note: In production with shared databases, be careful with AutoMigrate
	// But since we are adding columns to an existing table or creating it,
	// Gorm AutoMigrate is usually safe for adding columns.
	// However, we have migrations in Node.js too.
	// Best practice: Let Node.js handle schema via Sequelize Migrations.
	// We will rely on the table being there.
	// But to be safe for dev:
	// infra.DB.AutoMigrate(&models.Tenant{})
	// Commented out to respect Node.js migrations as source of truth.

	app := fiber.New()

	app.Use(logger.New())

	api := app.Group("/manage/v1")
	api.Use(middleware.AuthMiddleware)

	// Routes
	manage := app.Group("/manage/v1")
	manage.Post("/tenants", handlers.ProvisionTenant)
	manage.Get("/usage", handlers.GetUsage)

	log.Fatal(app.Listen(":8081"))
}
