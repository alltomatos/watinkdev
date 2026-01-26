package handlers

import (
	"context"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/watink/panel-core/database"
)

type CreatePlanInput struct {
	Name           string  `json:"name"`
	Price          float64 `json:"price"`
	MaxUsers       int     `json:"max_users"`
	MaxConnections int     `json:"max_connections"`
}

type Plan struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Price          float64 `json:"price"`
	MaxUsers       int     `json:"max_users"`
	MaxConnections int     `json:"max_connections"`
}

func CreatePlan(c *fiber.Ctx) error {
	var input CreatePlanInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	_, err := database.DB.Exec(context.Background(),
		`INSERT INTO saas_plans (name, price, max_users, max_connections) VALUES ($1, $2, $3, $4)`,
		input.Name, input.Price, input.MaxUsers, input.MaxConnections)

	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create plan"})
	}

	return c.Status(http.StatusCreated).JSON(fiber.Map{"message": "Plan created successfully"})
}

func ListPlans(c *fiber.Ctx) error {
	rows, err := database.DB.Query(context.Background(), "SELECT id, name, price, max_users, max_connections FROM saas_plans ORDER BY price ASC")
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch plans"})
	}
	defer rows.Close()

	plans := []Plan{}
	for rows.Next() {
		var p Plan
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.MaxUsers, &p.MaxConnections); err != nil {
			continue
		}
		plans = append(plans, p)
	}

	return c.JSON(plans)
}
