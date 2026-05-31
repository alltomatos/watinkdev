package controllers

import (
	"net/http"
	"strconv"

	"github.com/alltomatos/watinkdev/business/internal/domain"
	"github.com/alltomatos/watinkdev/business/internal/models"
	"github.com/alltomatos/watinkdev/business/internal/services"
	"github.com/gin-gonic/gin"
)

func ListUsers(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}

	users, err := appContainer.UserRepo.FindAll(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

func ShowUser(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}
	id, _ := strconv.Atoi(c.Param("userId"))

	user, err := appContainer.UserRepo.FindByID(c.Request.Context(), id, tenantID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func CreateUser(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}

	// SaaS Limit Check
	limitService := services.NewPlanLimitService()
	if err := limitService.CheckLimit(tenantID, "users"); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	domainUser := &domain.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: input.PasswordHash,
		TenantID:     tenantID,
		Profile:      input.Profile,
		WhatsappID:   input.WhatsappID,
		GroupID:      input.GroupID,
		Configs:      input.Configs,
	}

	if err := appContainer.UserRepo.Create(c.Request.Context(), domainUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusOK, domainUser)
}

func UpdateUser(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}
	id, _ := strconv.Atoi(c.Param("userId"))

	user, err := appContainer.UserRepo.FindByID(c.Request.Context(), id, tenantID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found or access denied"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updateMap := make(map[string]interface{})

	// Password: hash before persisting
	if pwd, ok := req["password"].(string); ok && pwd != "" {
		tmp := models.User{PasswordHash: user.PasswordHash}
		if err := tmp.HashPassword(pwd); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		updateMap["passwordHash"] = tmp.PasswordHash
	}

	// Scalar fields
	if v, ok := req["name"].(string); ok {
		updateMap["name"] = v
	}
	if v, ok := req["email"].(string); ok {
		updateMap["email"] = v
	}
	if v, ok := req["profile"].(string); ok {
		updateMap["profile"] = v
	}
	if v, ok := req["whatsappId"]; ok {
		if v == "" || v == nil {
			updateMap["whatsappId"] = nil
		} else {
			s := formatInt(v)
			updateMap["whatsappId"] = s
		}
	}
	if v, ok := req["groupId"]; ok {
		if v == "" || v == nil {
			updateMap["groupId"] = nil
		} else {
			s := formatInt(v)
			updateMap["groupId"] = s
		}
	}

	if err := appContainer.UserRepo.Update(c.Request.Context(), user, updateMap); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}
	id, _ := strconv.Atoi(c.Param("userId"))

	if err := appContainer.UserRepo.Delete(c.Request.Context(), id, tenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// formatInt converts an interface{} (float64 from JSON or string) to int64.
func formatInt(v interface{}) int64 {
	switch n := v.(type) {
	case float64:
		return int64(n)
	case string:
		i, _ := strconv.ParseInt(n, 10, 64)
		return i
	default:
		return 0
	}
}
