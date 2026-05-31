package controllers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/alltomatos/watinkdev/business/internal/database"
	"github.com/alltomatos/watinkdev/business/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTicketControllerTest(t *testing.T) *gorm.DB {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Exec(`DROP TABLE IF EXISTS "TicketLogs"`).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Exec(`DROP TABLE IF EXISTS "Tickets"`).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Exec(`CREATE TABLE "Tickets" (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		status TEXT NOT NULL DEFAULT 'pending',
		"lastMessage" TEXT,
		"contactId" INTEGER,
		"userId" INTEGER,
		"whatsappId" INTEGER,
		"isGroup" BOOLEAN NOT NULL DEFAULT false,
		"unreadMessages" INTEGER,
		"queueId" INTEGER,
		"tenantId" TEXT NOT NULL,
		"createdAt" DATETIME,
		"updatedAt" DATETIME
	)`).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Exec(`CREATE TABLE "TicketLogs" (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		"ticketId" INTEGER NOT NULL,
		"userId" INTEGER,
		type TEXT NOT NULL,
		payload TEXT,
		"tenantId" TEXT NOT NULL,
		"createdAt" DATETIME
	)`).Error; err != nil {
		t.Fatal(err)
	}

	previousDB := database.DB
	database.DB = db
	t.Cleanup(func() { database.DB = previousDB })

	// Initialize the DI container with test DB so controllers can resolve use cases.
	InitContainer()
	t.Cleanup(func() { appContainer = nil })

	return db
}

func TestUpdateTicketRejectsCrossTenantAccess(t *testing.T) {
	db := setupTicketControllerTest(t)

	tenantA := uuid.New()
	tenantB := uuid.New()
	ticket := models.Ticket{Status: "pending", ContactID: 1, WhatsappID: 1, TenantID: tenantA}
	if err := db.Create(&ticket).Error; err != nil {
		t.Fatal(err)
	}

	router := gin.New()
	router.PUT("/tickets/:ticketId", func(c *gin.Context) {
		c.Set("tenantId", tenantB.String())
		c.Set("userProfile", "admin")
		c.Set("userId", float64(10))
		UpdateTicket(c)
	})

	req := httptest.NewRequest(http.MethodPut, "/tickets/"+strconv.Itoa(ticket.ID), bytes.NewBufferString(`{"status":"closed"}`))
	req.Header.Set("Content-Type", "application/json")
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, body = %s", res.Code, res.Body.String())
	}

	var unchanged models.Ticket
	if err := db.First(&unchanged, ticket.ID).Error; err != nil {
		t.Fatal(err)
	}
	if unchanged.Status != "pending" {
		t.Fatalf("status changed to %s", unchanged.Status)
	}

	var logCount int64
	if err := db.Model(&models.TicketLog{}).Count(&logCount).Error; err != nil {
		t.Fatal(err)
	}
	if logCount != 0 {
		t.Fatalf("created %d ticket logs", logCount)
	}
}

func TestUpdateTicketCreatesTenantScopedLog(t *testing.T) {
	db := setupTicketControllerTest(t)

	tenantID := uuid.New()
	ticket := models.Ticket{Status: "pending", ContactID: 1, WhatsappID: 1, TenantID: tenantID}
	if err := db.Create(&ticket).Error; err != nil {
		t.Fatal(err)
	}

	router := gin.New()
	router.PUT("/tickets/:ticketId", func(c *gin.Context) {
		c.Set("tenantId", tenantID.String())
		c.Set("userProfile", "admin")
		c.Set("userId", float64(10))
		UpdateTicket(c)
	})

	req := httptest.NewRequest(http.MethodPut, "/tickets/"+strconv.Itoa(ticket.ID), bytes.NewBufferString(`{"status":"closed"}`))
	req.Header.Set("Content-Type", "application/json")
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", res.Code, res.Body.String())
	}

	var updated models.Ticket
	if err := db.First(&updated, ticket.ID).Error; err != nil {
		t.Fatal(err)
	}
	if updated.Status != "closed" {
		t.Fatalf("status = %s", updated.Status)
	}
	if updated.TenantID != tenantID {
		t.Fatalf("tenantId changed to %s", updated.TenantID)
	}

	var logs []models.TicketLog
	if err := db.Find(&logs).Error; err != nil {
		t.Fatal(err)
	}
	if len(logs) != 1 {
		t.Fatalf("logs = %d", len(logs))
	}
	if logs[0].TenantID != tenantID {
		t.Fatalf("log tenantId = %s", logs[0].TenantID)
	}
	if logs[0].TicketID != ticket.ID || logs[0].Type != "status" {
		t.Fatalf("unexpected log: ticketId=%d type=%s", logs[0].TicketID, logs[0].Type)
	}
}
