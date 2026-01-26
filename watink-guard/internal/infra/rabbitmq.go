package infra

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

var Channel *amqp.Channel

func ConnectRabbitMQ() {
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		log.Println("RABBITMQ_URL not set, skipping RabbitMQ connection")
		return
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ: ", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal("Failed to open a channel: ", err)
	}

	Channel = ch
	log.Println("RabbitMQ connected successfully")
}

func PublishEvent(queueName string, body interface{}) error {
	if Channel == nil {
		log.Println("RabbitMQ channel is nil, skipping publish")
		return nil
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = Channel.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return err
	}

	return Channel.PublishWithContext(ctx,
		"",        // exchange
		queueName, // routing key
		false,     // mandatory
		false,     // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        jsonBody,
		})
}
