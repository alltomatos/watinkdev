package handlers

import (
	"log"
	"watink-guard/internal/infra"
	"watink-guard/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CreateTenantRequest struct {
	Name           string `json:"name"`
	Plan           string `json:"plan"`
	Status         string `json:"status"`
	ExternalID     string `json:"externalId"`
	MaxUsers       int    `json:"maxUsers"`
	MaxConnections int    `json:"maxConnections"`
}

func ProvisionTenant(c *fiber.Ctx) error {
	var req CreateTenantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.ExternalID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "externalId is required"})
	}

	var tenant models.Tenant
	result := infra.DB.Where("external_id = ?", req.ExternalID).First(&tenant)

	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	// upsert logic
	if result.Error == gorm.ErrRecordNotFound {
		// Create
		tenant = models.Tenant{
			Name:           req.Name,
			Plan:           req.Plan,
			Status:         req.Status,
			ExternalID:     req.ExternalID,
			MaxUsers:       req.MaxUsers,
			MaxConnections: req.MaxConnections,
		}
		if err := infra.DB.Create(&tenant).Error; err != nil {
			log.Printf("Error creating tenant: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create tenant"})
		}
		log.Printf("Tenant created: %s", tenant.ID)
	} else {
		// Update
		tenant.Name = req.Name
		tenant.Plan = req.Plan
		tenant.Status = req.Status
		tenant.MaxUsers = req.MaxUsers
		tenant.MaxConnections = req.MaxConnections
		if err := infra.DB.Save(&tenant).Error; err != nil {
			log.Printf("Error updating tenant: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update tenant"})
		}
		log.Printf("Tenant updated: %s", tenant.ID)
	}

	// Publish Event
	event := map[string]interface{}{
		"tenantId":       tenant.ID,
		"externalId":     tenant.ExternalID,
		"plan":           tenant.Plan,
		"status":         tenant.Status,
		"maxUsers":       tenant.MaxUsers,
		"maxConnections": tenant.MaxConnections,
		"action":         "provisioned",
	}

	if err := infra.PublishEvent("saas.tenant_provisioned", event); err != nil {
		log.Printf("Error publishing event: %v", err)
		// We don't fail the request if publishing fails, but define this as a potential issue
	}

	return c.JSON(fiber.Map{
		"message": "Tenant provisioned successfully",
		"tenant":  tenant,
	})
}

type TenantUsage struct {
	ExternalID      string `json:"externalId"`
	TenantID        string `json:"tenantId"`
	UserCount       int64  `json:"userCount"`
	ConnectionCount int64  `json:"connectionCount"`
}

func GetUsage(c *fiber.Ctx) error {
	var results []TenantUsage

	err := infra.DB.Table("Tenants").
		Select("Tenants.external_id, Tenants.id as tenant_id, " +
			"(SELECT COUNT(*) FROM \"Users\" WHERE \"Users\".\"tenantId\" = \"Tenants\".id) as user_count, " +
			"(SELECT COUNT(*) FROM \"Whatsapps\" WHERE \"Whatsapps\".\"tenantId\" = \"Tenants\".id) as connection_count").
		Scan(&results).Error

	if err != nil {
		log.Printf("Error fetching usage: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch usage data"})
	}

	return c.JSON(results)
}
