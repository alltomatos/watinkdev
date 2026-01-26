package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2" // Import fiber
	"github.com/watink/push-proxy/services"
)

type PushRequest struct {
	Token string `json:"token"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

// SendPush recebe a requisição e publica na fila
func SendPush(c *fiber.Ctx) error {
	var req PushRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Payload inválido",
		})
	}

	// Validação básica
	if req.Token == "" || req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Token e Title são obrigatórios",
		})
	}

	// Publicar no RabbitMQ usando o Service
	if err := services.PublishToQueue(req); err != nil {
		log.Printf("❌ Erro ao publicar na fila: %v", err)
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Falha ao enfileirar mensagem",
		})
	}

	// 202 Accepted - Processamento Assíncrono
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"message": "Notificação recebida e agendada para envio",
	})
}
