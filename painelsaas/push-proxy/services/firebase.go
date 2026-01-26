package services

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/messaging"
	"google.golang.org/api/option"
)

var FCMClient *messaging.Client

func InitFirebase() {
	creds := os.Getenv("FIREBASE_CREDENTIALS")
	if creds == "" {
		creds = "service-account.json"
	}

	opt := option.WithCredentialsFile(creds)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Printf("⚠️ [Firebase] Erro ao inicializar App: %v", err)
		return
	}

	FCMClient, err = app.Messaging(context.Background())
	if err != nil {
		log.Printf("⚠️ [Firebase] Erro ao obter cliente Messaging: %v", err)
		return
	}

	log.Println("✅ [Firebase] Cliente FCM inicializado")
}
