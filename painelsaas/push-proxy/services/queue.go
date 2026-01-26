package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const QueueName = "push_notifications"

var (
	amqpConn    *amqp.Connection
	amqpChannel *amqp.Channel
)

// ConnectQueue inicializa conexão com RabbitMQ
func ConnectQueue() error {
	var err error
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		url = "amqp://guest:guest@localhost:5672/"
	}

	// Retry loop
	for i := 0; i < 15; i++ {
		amqpConn, err = amqp.Dial(url)
		if err == nil {
			break
		}
		log.Printf("⏳ [RabbitMQ] Tentativa %d/15 falhou. Retentando em 2s...", i+1)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		return fmt.Errorf("falha crítica ao conectar no RabbitMQ: %v", err)
	}

	amqpChannel, err = amqpConn.Channel()
	if err != nil {
		return fmt.Errorf("falha ao abrir canal AMQP: %v", err)
	}

	// Declarar fila durável para garantir persistência
	_, err = amqpChannel.QueueDeclare(
		QueueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return fmt.Errorf("falha ao declarar fila: %v", err)
	}

	fmt.Println("✅ [RabbitMQ] Conectado e Fila declarada com sucesso")
	return nil
}

// PublishToQueue publica uma mensagem na fila de notificações
func PublishToQueue(msg interface{}) error {
	if amqpChannel == nil {
		return fmt.Errorf("canal AMQP não inicializado")
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return amqpChannel.PublishWithContext(ctx,
		"",        // exchange
		QueueName, // routing key
		false,     // mandatory
		false,     // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent, // Importante: Persistir no disco
		},
	)
}

// GetChannel exporta o canal para o worker consumir
func GetChannel() *amqp.Channel {
	return amqpChannel
}

// CloseQueue fecha conexões
func CloseQueue() {
	if amqpChannel != nil {
		amqpChannel.Close()
	}
	if amqpConn != nil {
		amqpConn.Close()
	}
}
