package database

import (
	"context"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func Migrate() {
	ctx := context.Background()

	// 1. Create EXTENSIONS (PostGIS/Vector if needed in future, UUID for now)
	_, err := DB.Exec(ctx, `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
	if err != nil {
		fmt.Println("⚠️ Failed to create extension:", err)
	}

	// 2. Create SaasUsers Table
	queryUsers := `
	CREATE TABLE IF NOT EXISTS saas_users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(50) DEFAULT 'admin',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := DB.Exec(ctx, queryUsers); err != nil {
		panic("Failed to migrate users table: " + err.Error())
	}

	// 3. Create SaaS Plans Table
	// 3. Create SaaS Plans Table (PlanTemplate)
	queryPlans := `
	CREATE TABLE IF NOT EXISTS saas_plans (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		config_json JSONB DEFAULT '{}',
		owner_id UUID REFERENCES saas_users(id),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := DB.Exec(ctx, queryPlans); err != nil {
		panic("Failed to migrate plans table: " + err.Error())
	}

	// 4. Create Watink Instances Table (Instance)
	queryInstances := `
	CREATE TABLE IF NOT EXISTS watink_instances (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		owner_id UUID NOT NULL REFERENCES saas_users(id),
		name VARCHAR(255) NOT NULL,
		url VARCHAR(255) NOT NULL,
		api_key VARCHAR(255) UNIQUE NOT NULL, -- sk_live_...
		push_enabled BOOLEAN DEFAULT TRUE,
		status VARCHAR(50) DEFAULT 'active',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := DB.Exec(ctx, queryInstances); err != nil {
		panic("Failed to migrate instances table: " + err.Error())
	}

	// 5. Seed Default Admin (Safe Check)
	var count int
	DB.QueryRow(ctx, "SELECT COUNT(*) FROM saas_users WHERE email = 'admin@watink.com'").Scan(&count)

	if count == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		_, err := DB.Exec(ctx,
			"INSERT INTO saas_users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
			"Super Admin", "admin@watink.com", string(hash), "admin")
		if err != nil {
			fmt.Println("Failed to seed admin:", err)
		} else {
			fmt.Println("🌱 Seeded default admin: admin@watink.com / admin123")
		}
	}
}
