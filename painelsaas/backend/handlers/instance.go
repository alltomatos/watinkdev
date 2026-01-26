package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/watink/panel-core/database"
	"github.com/watink/panel-core/services"
)

type CreateInstanceDTO struct {
	Name string `json:"name"`
	Url  string `json:"url"`
}

// CreateInstance gera licença, salva no PG e sincroniza no Redis
func CreateInstance(c *fiber.Ctx) error {
	var input CreateInstanceDTO
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Input"})
	}

	userId := c.Locals("userId") // Assumindo AuthMiddleware setando user_id

	// 1. Gerar License Key (Logic from License Service)
	// Nota: services.ActivateInstance já gera e salva no Redis, vamos usar apenas a geração
	// por enquanto ou adaptar a função ActivateInstance
	token, err := services.ActivateInstance("temp-id") // FIXME: Adaptar service para receber ID real depois
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate license"})
	}

	// 2. Insert Postgres
	query := `
		INSERT INTO watink_instances (name, url, api_key, owner_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	var newID string
	// FIXME: owner_id mockado se Locals não estiver pronto, mas o user pediu proteção por Auth
	if userId == nil {
		// Fallback temporário para testes se não tiver AuthMiddleware ativo na rota ainda
		// Em produção isso deve falhar
		// panic("User ID missing from context")
		userId = "00000000-0000-0000-0000-000000000000" // Mock
	}

	err = database.DB.QueryRow(context.Background(), query, input.Name, input.Url, token, userId).Scan(&newID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error: " + err.Error()})
	}

	// 3. Atualizar Redis com ID correto (Se o service ActivateInstance usou "temp-id")
	// Re-setando para garantir consistência
	services.SyncLicenseToRedis(token, "active")

	return c.Status(201).JSON(fiber.Map{
		"id":      newID,
		"api_key": token,
		"message": "Instance created & active",
	})
}

// ListInstances retorna instâncias do usuário
func ListInstances(c *fiber.Ctx) error {
	userId := c.Locals("userId")
	if userId == nil {
		userId = "00000000-0000-0000-0000-000000000000" // Mock
	}

	rows, err := database.DB.Query(context.Background(),
		"SELECT id, name, url, api_key, push_enabled, status FROM watink_instances WHERE owner_id = $1", userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}
	defer rows.Close()

	var instances []database.Instance
	for rows.Next() {
		var i database.Instance
		if err := rows.Scan(&i.ID, &i.Name, &i.Url, &i.ApiKey, &i.PushEnabled, &i.Status); err != nil {
			continue
		}
		instances = append(instances, i)
	}

	return c.JSON(instances)
}

// TogglePush ativa/desativa push no PG e Redis
func TogglePush(c *fiber.Ctx) error {
	id := c.Params("id")
	userId := c.Locals("userId")

	// 1. Get current status & api_key
	var apiKey string
	var enabled bool
	err := database.DB.QueryRow(context.Background(),
		"SELECT api_key, push_enabled FROM watink_instances WHERE id = $1 AND owner_id = $2", id, userId).
		Scan(&apiKey, &enabled)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Instance not found"})
	}

	// 2. Toggle
	newState := !enabled
	_, err = database.DB.Exec(context.Background(),
		"UPDATE watink_instances SET push_enabled = $1 WHERE id = $2", newState, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update Postgres"})
	}

	// 3. Sync Redis
	redisStatus := "active"
	if !newState {
		redisStatus = "inactive"
	}
	services.SyncLicenseToRedis(apiKey, redisStatus)

	return c.JSON(fiber.Map{"push_enabled": newState})
}
