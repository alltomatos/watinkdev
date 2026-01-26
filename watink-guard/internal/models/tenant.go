package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tenant struct {
	ID             string         `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	Name           string         `json:"name"`
	Status         string         `json:"status" gorm:"default:'active'"`
	Plan           string         `json:"plan"`
	MaxUsers       int            `json:"maxUsers" gorm:"default:1"`
	MaxConnections int            `json:"maxConnections" gorm:"default:1"`
	ExternalID     string         `json:"externalId" gorm:"uniqueIndex"`
	OwnerID        *uint          `json:"ownerId"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (t *Tenant) BeforeCreate(tx *gorm.DB) (err error) {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}
	return
}
