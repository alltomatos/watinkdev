package middleware

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/watink/push-proxy/database"
)

// AuthMiddleware valida o token de licença no Header
func AuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Token de autorização ausente",
		})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Formato de token inválido (Use: Bearer <token>)",
		})
	}

	token := parts[1]

	// Verificar no Redis
	ctx := context.Background()
	status, err := database.RedisClient.Get(ctx, "license:"+token).Result()

	if err != nil || status != "active" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Licença inválida ou inativa",
		})
	}

	return c.Next()
}
