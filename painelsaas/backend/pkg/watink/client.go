package watink

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Client struct {
	BaseURL   string
	APIKey    string
	JWTSecret string
}

type StatsResponse struct {
	Users   int `json:"users"`
	Tenants struct {
		Total    int `json:"total"`
		Active   int `json:"active"`
		Inactive int `json:"inactive"`
	} `json:"tenants"`
	Connections struct {
		Connected int `json:"connected"`
		Total     int `json:"total"`
	} `json:"connections"`
}

func NewClient(baseURL, apiKey, jwtSecret string) *Client {
	return &Client{
		BaseURL:   baseURL,
		APIKey:    apiKey,
		JWTSecret: jwtSecret,
	}
}

// GenerateSuperAdminToken creates a signed JWT using the instance's secret
// This mimics the token structure expected by Watink Backend isAuth middleware
func (c *Client) GenerateSuperAdminToken() (string, error) {
	// Payload matching TokenPayload in watink backend
	claims := jwt.MapClaims{
		"id":       "999999", // Fake ID or -1, assuming Admin check bypasses or user exists
		"username": "SaaS SuperAdmin",
		"profile":  "admin", // CRITICAL: Gives Full Access
		"tenantId": 1,       // Default tenant
		"iat":      time.Now().Unix(),
		"exp":      time.Now().Add(time.Hour * 1).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(c.JWTSecret))
}

func (c *Client) GetStats() (*StatsResponse, error) {
	token, err := c.GenerateSuperAdminToken()
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/saas/stats", c.BaseURL), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("remote instance returned status %d", resp.StatusCode)
	}

	var stats StatsResponse
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, err
	}

	return &stats, nil
}
