package middleware

import (
	"os"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware(c *fiber.Ctx) error {
	apiKey := c.Get("X-Watink-Master-Key")
	expectedKey := os.Getenv("WATINK_MASTER_KEY")

	if expectedKey == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Server misconfiguration: WATINK_MASTER_KEY not set",
		})
	}

	if apiKey != expectedKey {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	return c.Next()
}
