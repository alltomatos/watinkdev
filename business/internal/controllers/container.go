package controllers

import (
	"github.com/alltomatos/watinkdev/business/internal/application"
	"github.com/alltomatos/watinkdev/business/internal/database"
)

// appContainer holds the DI container for all controllers.
// Initialized once at startup via InitContainer.
var appContainer *application.Container

// InitContainer initializes the dependency injection container.
// Called once at startup in main.go.
func InitContainer() {
	appContainer = application.NewContainer(database.DB)
}
