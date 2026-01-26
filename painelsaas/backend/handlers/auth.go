package handlers

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/watink/panel-core/database"
	"golang.org/x/crypto/bcrypt"
)

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func Login(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		fmt.Printf("⚠️ Login failed: Invalid request body. Error: %v\n", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	fmt.Printf("🔍 Attempting login for email: %s\n", input.Email)

	var user User
	var passwordHash string

	// Find User
	err := database.DB.QueryRow(context.Background(),
		"SELECT id, name, email, role, password_hash FROM saas_users WHERE email = $1",
		input.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &passwordHash)

	if err != nil {
		fmt.Printf("❌ Login failed: User not found or DB error. Email: %s, Error: %v\n", input.Email, err)
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// Verify User
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.Password)); err != nil {
		fmt.Printf("❌ Login failed: Invalid password for email: %s\n", input.Email)
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	})

	// Sign
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		fmt.Println("⚠️ JWT_SECRET not found, using default unsafe secret")
		secret = "default_secret_unsafe" // TODO: Change in prod
	}

	t, err := token.SignedString([]byte(secret))
	if err != nil {
		fmt.Printf("❌ Login failed: Token generation error for email: %s, Error: %v\n", input.Email, err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	fmt.Printf("✅ Login successful for user: %s (%s)\n", user.Name, user.Email)

	return c.JSON(AuthResponse{
		Token: t,
		User:  user,
	})
}
