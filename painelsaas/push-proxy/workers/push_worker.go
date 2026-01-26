package workers

import (
	"context"
	"encoding/json"
	"log"

	"firebase.google.com/go/messaging"
	"github.com/watink/push-proxy/services"
)

type PushMessage struct {
	Token string `json:"token"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

// StartWorker inicia o consumidor RabbitMQ
func StartWorker() {
	if services.GetChannel() == nil {
		log.Println("⚠️ [Worker] Canal RabbitMQ não disponível. Worker não iniciado.")
		return
	}

	msgs, err := services.GetChannel().Consume(
		services.QueueName,
		"",    // consumer
		false, // auto-ack (False para processar manuamente)
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		log.Fatalf("❌ [Worker] Falha ao registrar consumidor: %v", err)
	}

	log.Println("👷 [Worker] Iniciado. Aguardando mensagens...")

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			var req PushMessage
			// Parse JSON
			if err := json.Unmarshal(d.Body, &req); err != nil {
				log.Printf("❌ [Worker] JSON inválido: %v", err)
				d.Nack(false, false) // Descarta mensagem inválida
				continue
			}

			// Enviar para Firebase
			if services.FCMClient == nil {
				log.Printf("⚠️ [Worker] FCM não inicializado. Simulando envio para %s", req.Token)
				d.Ack(false)
				continue
			}

			_, err := services.FCMClient.Send(context.Background(), &messaging.Message{
				Token: req.Token,
				Notification: &messaging.Notification{
					Title: req.Title,
					Body:  req.Body,
				},
			})

			if err != nil {
				log.Printf("❌ [Worker] Erro FCM: %v", err)
				// Em produção, implementar lógica de retry (Nack com requeue ou DLQ)
				// d.Nack(false, true)
				d.Ack(false) // Ack para não travar fila (Assumindo erro fatal por enquanto)
			} else {
				log.Printf("✅ [Worker] Push enviado: %s", req.Title)
				d.Ack(false)
			}
		}
	}()

	<-forever
}
