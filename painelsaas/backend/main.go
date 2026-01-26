package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/watink/panel-core/crypto"
	"github.com/watink/panel-core/database"
	"github.com/watink/panel-core/handlers"
	"github.com/watink/panel-core/middleware"
)

// Version injected at build time
var Version = "1.0.0-dev"

func main() {
	// Initialize Crypto Vault (Env Key)
	crypto.InitVault()

	// Initialize Database
	database.Connect()
	database.ConnectRedis() // Initialize Redis connection
	defer database.Close()

	// Run Migrations (Seed tables)
	database.Migrate()

	// Initializing Fiber App
	app := fiber.New(fiber.Config{
		AppName:       "Watink Panel SaaS Core v" + Version,
		CaseSensitive: true,
		StrictRouting: true,
	})

	// Middlewares
	app.Use(logger.New())  // Request Logging
	app.Use(recover.New()) // Panic Recovery
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // TODO: Restrict in Production
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Health Check Route
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "online",
			"service": "panel-core",
			"version": Version,
		})
	})

	// API Group
	api := app.Group("/api/v1")

	// Public Routes
	api.Post("/auth/login", handlers.Login)
	api.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Panel SaaS API v1")
	})

	// Protected Routes (JWT Required)
	api.Use(middleware.Protected())

	// Instances Management
	// Instances Management
	api.Post("/instances", handlers.CreateInstance)
	api.Get("/instances", handlers.ListInstances)
	api.Post("/instances/:id/toggle", handlers.TogglePush)
	// api.Delete("/instances/:id", handlers.DeleteInstance) // TODO
	// api.Get("/instances/:id/stats", handlers.GetInstanceStats) // TODO

	// Plans Management
	// api.Post("/plans", handlers.CreatePlan) // TODO
	// api.Get("/plans", handlers.ListPlans) // TODO

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port different from Watink Backend (8080)
	}

	log.Printf("🚀 Panel Core running on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
