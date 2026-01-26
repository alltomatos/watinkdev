package database

import (
	"time"
)

// Instance representa uma instância do Watink gerenciada pelo SaaS
type Instance struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"owner_id"`
	Name        string    `json:"name"`
	Url         string    `json:"url"`
	ApiKey      string    `json:"api_key"`
	PushEnabled bool      `json:"push_enabled"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

// PlanTemplate representa um modelo de plano
type PlanTemplate struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	ConfigJSON map[string]interface{} `json:"config_json"`
	OwnerID    string                 `json:"owner_id"`
	CreatedAt  time.Time              `json:"created_at"`
}
