package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/watink/plugin-manager/internal/database"
)

type VersionResponse struct {
	Service     string `json:"service"`
	Version     string `json:"version"`
	LastUpdated string `json:"lastUpdated"`
}

type ActivationRequest struct {
	LicenseKey string `json:"licenseKey,omitempty"`
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func VersionHandler(w http.ResponseWriter, r *http.Request) {
	currentVersion := "1.0.40"
	// Try to read from VERSION file if exists
	data, err := os.ReadFile("VERSION")
	if err == nil {
		currentVersion = strings.TrimSpace(string(data))
	}

	resp := VersionResponse{
		Service:     "plugin-manager",
		Version:     currentVersion,
		LastUpdated: time.Now().Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func CatalogHandler(w http.ResponseWriter, r *http.Request) {
	catalog, err := database.GetCatalog()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch catalog"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(catalog)
}

func InstalledHandler(w http.ResponseWriter, r *http.Request) {
	tenantId := r.Context().Value(TenantIDKey)
	if tenantId == nil {
		http.Error(w, "Tenant ID not found in context", http.StatusUnauthorized)
		return
	}

	installed, err := database.GetInstalled(tenantId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch installed plugins"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(installed)
}

func ActivateHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]

	tenantId := r.Context().Value(TenantIDKey)
	if tenantId == nil {
		http.Error(w, "Tenant ID not found in context", http.StatusUnauthorized)
		return
	}

	var req ActivationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// It's OK if body is empty for free plugins
	}

	err := database.ActivatePlugin(tenantId, slug, req.LicenseKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Plugin activated successfully",
		"slug":    slug,
	})
}

func DeactivateHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]

	tenantId := r.Context().Value(TenantIDKey)
	if tenantId == nil {
		http.Error(w, "Tenant ID not found in context", http.StatusUnauthorized)
		return
	}

	err := database.DeactivatePlugin(tenantId, slug)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Plugin deactivated successfully",
		"slug":    slug,
	})
}

func InstallHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]

	tenantId := r.Context().Value(TenantIDKey)
	if tenantId == nil {
		http.Error(w, "Tenant ID not found in context", http.StatusUnauthorized)
		return
	}

	var req ActivationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	err := database.InstallPlugin(tenantId, slug, req.LicenseKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Plugin installed successfully",
		"slug":    slug,
	})
}
