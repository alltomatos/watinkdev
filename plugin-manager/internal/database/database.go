package database

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

// Plugin represents a plugin in the catalog
type Plugin struct {
	ID          string  `json:"id"`
	Slug        string  `json:"slug"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Version     string  `json:"version"`
	Type        string  `json:"type"`     // free, premium
	Category    string  `json:"category"` // utility, channel, etc
	Price       float64 `json:"price"`
}

// CatalogResponse represents the full catalog response
type CatalogResponse struct {
	Offline bool     `json:"offline"`
	Plugins []Plugin `json:"plugins"`
}

// InstalledResponse represents the list of installed plugins
type InstalledResponse struct {
	Active []string `json:"active"`
}

var DB *sql.DB

func InitDB(dataSourceName string) {
	var err error
	DB, err = sql.Open("postgres", dataSourceName)
	if err != nil {
		log.Panicf("Error opening database connection: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Panicf("Error pinging database: %v", err)
	}

	log.Println("Connected to PostgreSQL successfully")
}

// GetCatalog returns the plugins from the database
func GetCatalog() (CatalogResponse, error) {
	rows, err := DB.Query(`
		SELECT id, slug, name, description, version, type, category, price 
		FROM "Plugins"
	`)
	if err != nil {
		log.Printf("Error querying catalog: %v", err)
		return CatalogResponse{Offline: true}, err
	}
	defer rows.Close()

	var plugins []Plugin
	for rows.Next() {
		var p Plugin
		var price sql.NullFloat64      // Handle nullable price
		var description sql.NullString // Handle nullable description
		var category sql.NullString    // Handle nullable category

		if err := rows.Scan(&p.ID, &p.Slug, &p.Name, &description, &p.Version, &p.Type, &category, &price); err != nil {
			log.Printf("Error scanning plugin: %v", err)
			continue
		}

		if price.Valid {
			p.Price = price.Float64
		}
		if description.Valid {
			p.Description = description.String
		}
		if category.Valid {
			p.Category = category.String
		}

		plugins = append(plugins, p)
	}

	return CatalogResponse{
		Offline: false,
		Plugins: plugins,
	}, nil
}

// GetInstalled returns the installed plugins from the database for a specific tenant
func GetInstalled(tenantId interface{}) (InstalledResponse, error) {
	rows, err := DB.Query(`
		SELECT DISTINCT p.slug 
		FROM "PluginInstallations" pi 
		JOIN "Plugins" p ON pi."pluginId" = p.id 
		WHERE pi."tenantId" = $1 AND pi.status = 'active'
	`, tenantId)
	if err != nil {
		log.Printf("Error querying installed plugins: %v", err)
		return InstalledResponse{}, err
	}
	defer rows.Close()

	var active []string
	for rows.Next() {
		var slug string
		if err := rows.Scan(&slug); err != nil {
			continue
		}
		active = append(active, slug)
	}

	return InstalledResponse{
		Active: active,
	}, nil
}

// GetPluginIDBySlug returns the plugin ID for a given slug
func GetPluginIDBySlug(slug string) (string, error) {
	var pluginID string
	err := DB.QueryRow(`SELECT id FROM "Plugins" WHERE slug = $1`, slug).Scan(&pluginID)
	if err != nil {
		return "", err
	}
	return pluginID, nil
}

// ActivatePlugin activates a plugin for a tenant (creates or updates installation)
func ActivatePlugin(tenantId interface{}, slug string, licenseKey string) error {
	pluginID, err := GetPluginIDBySlug(slug)
	if err != nil {
		log.Printf("Error getting plugin ID for slug %s: %v", slug, err)
		return err
	}

	// Check if installation already exists
	var existingID string
	err = DB.QueryRow(`
		SELECT id FROM "PluginInstallations" 
		WHERE "tenantId" = $1 AND "pluginId" = $2
	`, tenantId, pluginID).Scan(&existingID)

	if err == sql.ErrNoRows {
		// Insert new installation
		_, err = DB.Exec(`
			INSERT INTO "PluginInstallations" (id, "tenantId", "pluginId", status, "licenseKey", "installedAt", "updatedAt")
			VALUES (gen_random_uuid(), $1, $2, 'active', $3, NOW(), NOW())
		`, tenantId, pluginID, licenseKey)
	} else if err == nil {
		// Update existing installation
		_, err = DB.Exec(`
			UPDATE "PluginInstallations" 
			SET status = 'active', "updatedAt" = NOW()
			WHERE id = $1
		`, existingID)
	}

	if err != nil {
		log.Printf("Error activating plugin %s: %v", slug, err)
		return err
	}

	log.Printf("Plugin %s activated for tenant %v", slug, tenantId)
	return nil
}

// DeactivatePlugin deactivates a plugin for a tenant
func DeactivatePlugin(tenantId interface{}, slug string) error {
	pluginID, err := GetPluginIDBySlug(slug)
	if err != nil {
		log.Printf("Error getting plugin ID for slug %s: %v", slug, err)
		return err
	}

	_, err = DB.Exec(`
		UPDATE "PluginInstallations" 
		SET status = 'inactive', "updatedAt" = NOW()
		WHERE "tenantId" = $1 AND "pluginId" = $2
	`, tenantId, pluginID)

	if err != nil {
		log.Printf("Error deactivating plugin %s: %v", slug, err)
		return err
	}

	log.Printf("Plugin %s deactivated for tenant %v", slug, tenantId)
	return nil
}

// InstallPlugin installs a premium plugin with license key
func InstallPlugin(tenantId interface{}, slug string, licenseKey string) error {
	if licenseKey == "" {
		return sql.ErrNoRows // License key required for premium plugins
	}

	pluginID, err := GetPluginIDBySlug(slug)
	if err != nil {
		log.Printf("Error getting plugin ID for slug %s: %v", slug, err)
		return err
	}

	// TODO: Validate license key with external service

	// Insert new installation with pending status
	_, err = DB.Exec(`
		INSERT INTO "PluginInstallations" (id, "tenantId", "pluginId", status, "licenseKey", "createdAt", "updatedAt")
		VALUES (gen_random_uuid(), $1, $2, 'pending', $3, NOW(), NOW())
		ON CONFLICT ("tenantId", "pluginId") DO UPDATE SET "licenseKey" = $3, "updatedAt" = NOW()
	`, tenantId, pluginID, licenseKey)

	if err != nil {
		log.Printf("Error installing plugin %s: %v", slug, err)
		return err
	}

	log.Printf("Plugin %s installed for tenant %v", slug, tenantId)
	return nil
}
