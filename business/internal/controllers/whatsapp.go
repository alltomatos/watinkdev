package controllers

import (
	"net/http"
	"strconv"

	"github.com/alltomatos/watinkdev/business/internal/domain"
	"github.com/alltomatos/watinkdev/business/internal/models"
	"github.com/alltomatos/watinkdev/business/internal/services"
	"github.com/gin-gonic/gin"
)

func ListWhatsapps(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}

	whatsapps, err := appContainer.ChannelSessionRepo.FindAll(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch WhatsApp connections"})
		return
	}

	c.JSON(http.StatusOK, whatsapps)
}

func ShowWhatsapp(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))

	whatsapp, err := appContainer.ChannelSessionRepo.FindByID(c.Request.Context(), id, tenantID)
	if err != nil || whatsapp == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "WhatsApp connection not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, whatsapp)
}

func CreateWhatsapp(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}

	// SaaS Limit Check
	limitService := services.NewPlanLimitService()
	if err := limitService.CheckLimit(tenantID, "connections"); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	var input domain.ChannelSession
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.TenantID = tenantID
	if input.Status == "" {
		input.Status = "DISCONNECTED"
	}

	if input.IsDefault {
		if err := appContainer.ChannelSessionRepo.ResetDefaultFlag(c.Request.Context(), tenantID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset default connection"})
			return
		}
	}

	if err := appContainer.ChannelSessionRepo.Create(c.Request.Context(), &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, input)
}

func UpdateWhatsapp(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))

	whatsapp, err := appContainer.ChannelSessionRepo.FindByID(c.Request.Context(), id, tenantID)
	if err != nil || whatsapp == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "WhatsApp connection not found or access denied"})
		return
	}

	var input domain.ChannelSession
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.IsDefault {
		if err := appContainer.ChannelSessionRepo.ResetDefaultFlag(c.Request.Context(), tenantID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset default connection"})
			return
		}
	}

	fields := map[string]interface{}{
		"session":         input.Session,
		"qrcode":          input.Qrcode,
		"status":          input.Status,
		"battery":         input.Battery,
		"plugged":         input.Plugged,
		"name":            input.Name,
		"isDefault":       input.IsDefault,
		"retries":         input.Retries,
		"greetingMessage": input.GreetingMessage,
		"farewellMessage": input.FarewellMessage,
		"syncHistory":     input.SyncHistory,
		"syncPeriod":      input.SyncPeriod,
		"number":          input.Number,
		"profilePicUrl":   input.ProfilePicUrl,
		"keepAlive":       input.KeepAlive,
		"engineType":      input.EngineType,
	}

	if err := appContainer.ChannelSessionRepo.Update(c.Request.Context(), whatsapp, fields); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := appContainer.ChannelSessionRepo.FindByID(c.Request.Context(), id, tenantID)
	if err != nil || updated == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "WhatsApp connection not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func DeleteWhatsapp(c *gin.Context) {
	tenantID, err := tenantUUIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))

	whatsapp, err := appContainer.ChannelSessionRepo.FindByID(c.Request.Context(), id, tenantID)
	if err != nil || whatsapp == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "WhatsApp connection not found or access denied"})
		return
	}

	model := models.Whatsapp{
		ID:              whatsapp.ID,
		Session:         whatsapp.Session,
		Qrcode:          whatsapp.Qrcode,
		Status:          whatsapp.Status,
		Battery:         whatsapp.Battery,
		Plugged:         whatsapp.Plugged,
		Name:            whatsapp.Name,
		IsDefault:       whatsapp.IsDefault,
		Retries:         whatsapp.Retries,
		GreetingMessage: whatsapp.GreetingMessage,
		FarewellMessage: whatsapp.FarewellMessage,
		TenantID:        whatsapp.TenantID,
		SyncHistory:     whatsapp.SyncHistory,
		SyncPeriod:      whatsapp.SyncPeriod,
		Number:          whatsapp.Number,
		ProfilePicUrl:   whatsapp.ProfilePicUrl,
		KeepAlive:       whatsapp.KeepAlive,
		CreatedAt:       whatsapp.CreatedAt,
		UpdatedAt:       whatsapp.UpdatedAt,
		FirstConnection: whatsapp.FirstConnection,
		EngineType:      whatsapp.EngineType,
	}
	if err := services.DeleteWhatsAppSession(model); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to disconnect WhatsApp session before deletion"})
		return
	}

	if err := appContainer.ChannelSessionRepo.DeleteWithRelations(c.Request.Context(), id, tenantID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to delete connection: " + err.Error()})
		return
	}

	// Notify via socket
	services.EmitToNamespace("/", "whatsapp", gin.H{
		"action":     "delete",
		"whatsappId": whatsapp.ID,
	})

	c.JSON(http.StatusOK, gin.H{"message": "WhatsApp connection deleted"})
}
