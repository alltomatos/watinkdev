package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"os" // Added missing import
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Envelope struct {
	ID        string          `json:"id"`
	Timestamp int64           `json:"timestamp"`
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
}

type SmtpPayload struct {
	ResultEnvID string      `json:"resultEnvId,omitempty"` // ID do envelope original para resposta (se houver)
	TenantID    interface{} `json:"tenantId"`
	Host        string      `json:"host"`
	Port        int         `json:"port"`
	User        string      `json:"user"`
	Password    string      `json:"password"`
	Secure      bool        `json:"secure"`
	EmailFrom   string      `json:"emailFrom"`
	To          string      `json:"to"`
	Subject     string      `json:"subject"`
	Text        string      `json:"text"`
	Html        string      `json:"html"`
}

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	queueName := "smtp.email.queue"
	exchangeName := "wbot.commands"
	routingKey := "smtp.send"

	log.Printf("Connecting to RabbitMQ at %s", rabbitURL)
	var conn *amqp.Connection
	var err error
	for i := 0; i < 10; i++ {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ, retrying... %v", err)
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		log.Fatal("Could not connect to RabbitMQ")
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal(err)
	}
	defer ch.Close()

	// Declare Exchange
	err = ch.ExchangeDeclare(
		exchangeName, // name
		"topic",      // type
		true,         // durable
		false,        // auto-deleted
		false,        // internal
		false,        // no-wait
		nil,          // arguments
	)
	if err != nil {
		log.Fatal(err)
	}

	// Declare Queue
	q, err := ch.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Fatal(err)
	}

	// Bind Queue
	err = ch.QueueBind(
		q.Name,       // queue name
		routingKey,   // routing key
		exchangeName, // exchange
		false,
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatal(err)
	}

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			log.Printf("Received a message with routing key: %s", d.RoutingKey)

			var envelope Envelope
			if err := json.Unmarshal(d.Body, &envelope); err != nil {
				log.Printf("Error decoding envelope: %v", err)
				d.Nack(false, false) // Reject
				continue
			}

			if envelope.Type != "smtp.send" {
				log.Printf("Ignoring message type: %s", envelope.Type)
				d.Ack(false)
				continue
			}

			var payload SmtpPayload
			if err := json.Unmarshal(envelope.Payload, &payload); err != nil {
				log.Printf("Error decoding payload: %v", err)
				d.Nack(false, false)
				continue
			}

			err := sendEmail(payload)
			if err != nil {
				log.Printf("Failed to send email: %v", err)
				// Put back in queue? Or discard?
				// For now, let's requeue once or just log and ack/nack depending on error logic.
				// Assuming critical failure (auth) -> Nack false (discard/DLQ if setup).
				// But for test purposes, if we fail, we probably want to inspect logs.
				// Let's Nack without requeue to avoid loop if config is bad.
				d.Nack(false, false)
			} else {
				log.Printf("Email sent successfully to %s", payload.To)
				d.Ack(false)
			}
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}

func sendEmail(p SmtpPayload) error {
	addr := fmt.Sprintf("%s:%d", p.Host, p.Port)
	log.Printf("Sending email via %s...", addr)

	auth := smtp.PlainAuth("", p.User, p.Password, p.Host)

	// Headers
	headers := make(map[string]string)
	headers["From"] = p.EmailFrom
	headers["To"] = p.To
	headers["Subject"] = p.Subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"UTF-8\""

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + p.Html // Using HTML body

	// Handle TLS/SSL
	// net/smtp SendMail uses STARTTLS if supported and port is not 465 (usually).
	// For implicit SSL (465), we need explicit TLS connection.

	if p.Port == 465 || p.Secure {
		return sendMailTLS(addr, auth, p.EmailFrom, []string{p.To}, []byte(message), p.Host)
	}

	return smtp.SendMail(addr, auth, p.EmailFrom, []string{p.To}, []byte(message))
}

func sendMailTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte, host string) error {
	// TLS config
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // Allow self-signed for testing, ideally strictly validated
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return err
	}
	defer conn.Close()

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer c.Close()

	if auth != nil {
		if ok, _ := c.Extension("AUTH"); ok {
			if err = c.Auth(auth); err != nil {
				return err
			}
		}
	}

	if err = c.Mail(from); err != nil {
		return err
	}
	for _, addr := range to {
		if err = c.Rcpt(addr); err != nil {
			return err
		}
	}
	w, err := c.Data()
	if err != nil {
		return err
	}
	_, err = w.Write(msg)
	if err != nil {
		return err
	}
	err = w.Close()
	if err != nil {
		return err
	}
	return c.Quit()
}
