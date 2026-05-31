package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Ticket represents a support ticket in the system
type Ticket struct {
	ID             int       `json:"id"`
	Status         string    `json:"status"`
	LastMessage    string    `json:"lastMessage"`
	ContactID      int       `json:"contactId"`
	UserID         *int      `json:"userId"`
	WhatsappID     int       `json:"whatsappId"`
	IsGroup        bool      `json:"isGroup"`
	UnreadMessages int       `json:"unreadMessages"`
	QueueID        *int      `json:"queueId"`
	TenantID       uuid.UUID `json:"tenantId"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Message represents a message in a ticket conversation
type Message struct {
	ID          string    `json:"id"`
	Body        string    `json:"body"`
	Ack         int       `json:"ack"`
	Read        bool      `json:"read"`
	MediaType   string    `json:"mediaType"`
	MediaUrl    string    `json:"mediaUrl"`
	TicketID    int       `json:"ticketId"`
	FromMe      bool      `json:"fromMe"`
	IsDeleted   bool      `json:"isDeleted"`
	ContactID   *int      `json:"contactId"`
	QuotedMsgID *string   `json:"quotedMsgId"`
	TenantID    uuid.UUID `json:"tenantId"`
	Reactions   string    `json:"reactions"`
	DataJson    string    `json:"dataJson"`
	Participant string    `json:"participant"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Contact represents a customer contact
type Contact struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Number        string    `json:"number"`
	ProfilePicUrl string    `json:"profilePicUrl"`
	Email         string    `json:"email"`
	IsGroup       bool      `json:"isGroup"`
	TenantID      uuid.UUID `json:"tenantId"`
	Lid           *string   `json:"lid"`
	WalletUserID  *int      `json:"walletUserId"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Queue represents a support queue with distribution settings
type Queue struct {
	ID                   int       `json:"id"`
	Name                 string    `json:"name"`
	Color                string    `json:"color"`
	GreetingMessage      string    `json:"greetingMessage"`
	DistributionStrategy string    `json:"distributionStrategy"`
	PrioritizeWallet     bool      `json:"prioritizeWallet"`
	ParentID             *int      `json:"parentId"`
	TenantID             uuid.UUID `json:"tenantId"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

// User represents a system user (agent/admin)
type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	TokenVersion int       `json:"tokenVersion"`
	Profile      string    `json:"profile"`
	WhatsappID   *int      `json:"whatsappId"`
	TenantID     uuid.UUID `json:"tenantId"`
	GroupID      *int      `json:"groupId"`
	Configs      string    `json:"configs"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// ChannelSession represents a session with a messaging channel (WhatsApp, Telegram, etc.)
type ChannelSession struct {
	ID              int        `json:"id"`
	Session         string     `json:"session"`
	Qrcode          string     `json:"qrcode"`
	Status          string     `json:"status"`
	Battery         string     `json:"battery"`
	Plugged         bool       `json:"plugged"`
	Name            string     `json:"name"`
	IsDefault       bool       `json:"isDefault"`
	Retries         int        `json:"retries"`
	GreetingMessage string     `json:"greetingMessage"`
	FarewellMessage string     `json:"farewellMessage"`
	TenantID        uuid.UUID  `json:"tenantId"`
	SyncHistory     bool       `json:"syncHistory"`
	SyncPeriod      string     `json:"syncPeriod"`
	Number          string     `json:"number"`
	ProfilePicUrl   string     `json:"profilePicUrl"`
	KeepAlive       bool       `json:"keepAlive"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
	FirstConnection *time.Time `json:"firstConnection"`
	EngineType      string     `json:"engineType"`
}

// Repository Interfaces

type TicketRepository interface {
	FindByID(ctx context.Context, id int, tenantID uuid.UUID) (*Ticket, error)
	FindOpenByContact(ctx context.Context, tenantID uuid.UUID, contactID int, sessionID int) (*Ticket, error)
	Save(ctx context.Context, ticket *Ticket) error
	Update(ctx context.Context, ticket *Ticket, fields map[string]interface{}) error
}

type MessageRepository interface {
	Create(ctx context.Context, msg *Message) error
	FindByID(ctx context.Context, id string, tenantID uuid.UUID) (*Message, error)
	Update(ctx context.Context, msg *Message, fields map[string]interface{}) error
}

type ContactRepository interface {
	FindByNumber(ctx context.Context, tenantID uuid.UUID, number string, isGroup bool) (*Contact, error)
	Create(ctx context.Context, contact *Contact) error
	Update(ctx context.Context, contact *Contact, fields map[string]interface{}) error
}

type QueueRepository interface {
	FindByID(ctx context.Context, id int, tenantID uuid.UUID) (*Queue, error)
	FindAll(ctx context.Context, tenantID uuid.UUID) ([]Queue, error)
	Save(ctx context.Context, queue *Queue) error
}

type UserRepository interface {
	FindByID(ctx context.Context, id int, tenantID uuid.UUID) (*User, error)
	FindByEmail(ctx context.Context, email string, tenantID uuid.UUID) (*User, error)
	Save(ctx context.Context, user *User) error
}

// Channel Adapter Interface
type ChannelAdapter interface {
	SendMessage(ctx context.Context, ticket Ticket, message Message) error
	StartSession(ctx context.Context, session ChannelSession) error
	StopSession(ctx context.Context, sessionID int) error
	DeleteSession(ctx context.Context, sessionID int) error
}

// Domain Events
type DomainEvent interface {
	EventName() string
	TenantID() uuid.UUID
}

type TicketAssignedEvent struct {
	TicketID int
	UserID   int
	tenantID uuid.UUID
}

func (e TicketAssignedEvent) EventName() string { return "TicketAssigned" }
func (e TicketAssignedEvent) TenantID() uuid.UUID { return e.tenantID }

func NewTicketAssignedEvent(ticketID, userID int, tenantID uuid.UUID) TicketAssignedEvent {
	return TicketAssignedEvent{TicketID: ticketID, UserID: userID, tenantID: tenantID}
}

type MessageReceivedEvent struct {
	MessageID string
	TicketID  int
	tenantID  uuid.UUID
}

func (e MessageReceivedEvent) EventName() string { return "MessageReceived" }
func (e MessageReceivedEvent) TenantID() uuid.UUID { return e.tenantID }

func NewMessageReceivedEvent(messageID string, ticketID int, tenantID uuid.UUID) MessageReceivedEvent {
	return MessageReceivedEvent{MessageID: messageID, TicketID: ticketID, tenantID: tenantID}
}

type TicketStatusChangedEvent struct {
	TicketID  int
	OldStatus string
	NewStatus string
	tenantID  uuid.UUID
}

func (e TicketStatusChangedEvent) EventName() string { return "TicketStatusChanged" }
func (e TicketStatusChangedEvent) TenantID() uuid.UUID { return e.tenantID }

func NewTicketStatusChangedEvent(ticketID int, oldStatus, newStatus string, tenantID uuid.UUID) TicketStatusChangedEvent {
	return TicketStatusChangedEvent{TicketID: ticketID, OldStatus: oldStatus, NewStatus: newStatus, tenantID: tenantID}
}

type ContactCreatedEvent struct {
	ContactID int
	tenantID  uuid.UUID
}

func (e ContactCreatedEvent) EventName() string { return "ContactCreated" }
func (e ContactCreatedEvent) TenantID() uuid.UUID { return e.tenantID }

func NewContactCreatedEvent(contactID int, tenantID uuid.UUID) ContactCreatedEvent {
	return ContactCreatedEvent{ContactID: contactID, tenantID: tenantID}
}

type SessionStatusChangedEvent struct {
	SessionID int
	Status    string
	tenantID  uuid.UUID
}

func (e SessionStatusChangedEvent) EventName() string { return "SessionStatusChanged" }
func (e SessionStatusChangedEvent) TenantID() uuid.UUID { return e.tenantID }

func NewSessionStatusChangedEvent(sessionID int, status string, tenantID uuid.UUID) SessionStatusChangedEvent {
	return SessionStatusChangedEvent{SessionID: sessionID, Status: status, tenantID: tenantID}
}

// EventBus Interface
type EventBus interface {
	Publish(ctx context.Context, event DomainEvent) error
	Subscribe(eventName string, handler EventHandler) error
}

type EventHandler func(ctx context.Context, event DomainEvent) error