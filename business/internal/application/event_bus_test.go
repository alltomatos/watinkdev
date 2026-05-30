package application

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"github.com/alltomatos/watinkdev/business/internal/domain"
	"github.com/google/uuid"
)

func TestNewInMemoryEventBus(t *testing.T) {
	bus := NewInMemoryEventBus()
	if bus == nil {
		t.Fatal("NewInMemoryEventBus returned nil")
	}
	if bus.subscribers == nil {
		t.Fatal("subscribers map not initialized")
	}
}

func TestPublishWithNoSubscribers(t *testing.T) {
	bus := NewInMemoryEventBus()
	event := domain.NewTicketAssignedEvent(1, 2, uuid.New())
	err := bus.Publish(context.Background(), event)
	if err != nil {
		t.Errorf("Publish with no subscribers should return nil, got %v", err)
	}
}

func TestSubscribeAndPublish(t *testing.T) {
	bus := NewInMemoryEventBus()
	tenantID := uuid.New()

	var called int32

	handler := func(ctx context.Context, event domain.DomainEvent) error {
		atomic.AddInt32(&called, 1)
		return nil
	}

	err := bus.Subscribe("TicketAssigned", handler)
	if err != nil {
		t.Fatalf("Subscribe returned error: %v", err)
	}

	event := domain.NewTicketAssignedEvent(1, 2, tenantID)

	err = bus.Publish(context.Background(), event)
	if err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}

	// Handlers run in goroutines; wait up to 100ms.
	deadline := make(chan struct{})
	go func() {
		for atomic.LoadInt32(&called) == 0 {
			// busy-wait briefly
		}
		close(deadline)
	}()

	select {
	case <-deadline:
		// success
	case <-time.After(100 * time.Millisecond):
		t.Fatal("handler was not called within timeout")
	}

	if atomic.LoadInt32(&called) != 1 {
		t.Errorf("expected handler called once, got %d", atomic.LoadInt32(&called))
	}
}

func TestMultipleSubscribers(t *testing.T) {
	bus := NewInMemoryEventBus()
	tenantID := uuid.New()

	var called int32

	handler := func(ctx context.Context, event domain.DomainEvent) error {
		atomic.AddInt32(&called, 1)
		return nil
	}

	err := bus.Subscribe("TicketAssigned", handler)
	if err != nil {
		t.Fatalf("Subscribe returned error: %v", err)
	}
	err = bus.Subscribe("TicketAssigned", handler)
	if err != nil {
		t.Fatalf("Second Subscribe returned error: %v", err)
	}

	event := domain.NewTicketAssignedEvent(1, 2, tenantID)
	err = bus.Publish(context.Background(), event)
	if err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}

	// Wait for both goroutines
	deadline := make(chan struct{})
	go func() {
		for atomic.LoadInt32(&called) < 2 {
			// busy-wait briefly
		}
		close(deadline)
	}()

	select {
	case <-deadline:
		// success
	case <-time.After(100 * time.Millisecond):
		t.Fatalf("expected 2 handler calls, got %d within timeout", atomic.LoadInt32(&called))
	}

	if atomic.LoadInt32(&called) != 2 {
		t.Errorf("expected handler called twice, got %d", atomic.LoadInt32(&called))
	}
}

func TestSubscribeDifferentEvents(t *testing.T) {
	bus := NewInMemoryEventBus()
	tenantID := uuid.New()

	var ticketCalls int32
	var messageCalls int32

	ticketHandler := func(ctx context.Context, event domain.DomainEvent) error {
		atomic.AddInt32(&ticketCalls, 1)
		return nil
	}
	messageHandler := func(ctx context.Context, event domain.DomainEvent) error {
		atomic.AddInt32(&messageCalls, 1)
		return nil
	}

	_ = bus.Subscribe("TicketAssigned", ticketHandler)
	_ = bus.Subscribe("MessageReceived", messageHandler)

	// Publish a TicketAssigned event — only ticketHandler should fire.
	_ = bus.Publish(context.Background(), domain.NewTicketAssignedEvent(1, 2, tenantID))

	deadline := make(chan struct{})
	go func() {
		for atomic.LoadInt32(&ticketCalls) < 1 {
			// busy-wait
		}
		close(deadline)
	}()

	select {
	case <-deadline:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("ticket handler was not called within timeout")
	}

	if atomic.LoadInt32(&messageCalls) != 0 {
		t.Errorf("message handler should not have been called, got %d calls", atomic.LoadInt32(&messageCalls))
	}
	if atomic.LoadInt32(&ticketCalls) != 1 {
		t.Errorf("expected 1 ticket handler call, got %d", atomic.LoadInt32(&ticketCalls))
	}
}

func TestEventBusImplementsInterface(t *testing.T) {
	// Compile-time check that InMemoryEventBus satisfies domain.EventBus.
	var _ domain.EventBus = NewInMemoryEventBus()
}

func TestPublishPreservesEventTenantID(t *testing.T) {
	bus := NewInMemoryEventBus()
	tenantID := uuid.New()

	var receivedTenantID uuid.UUID

	handler := func(ctx context.Context, event domain.DomainEvent) error {
		receivedTenantID = event.TenantID()
		return nil
	}

	_ = bus.Subscribe("TicketAssigned", handler)
	_ = bus.Publish(context.Background(), domain.NewTicketAssignedEvent(1, 2, tenantID))

	deadline := make(chan struct{})
	go func() {
		for receivedTenantID == uuid.Nil {
			// busy-wait
		}
		close(deadline)
	}()

	select {
	case <-deadline:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("handler was not called within timeout")
	}

	if receivedTenantID != tenantID {
		t.Errorf("expected tenantID %s, got %s", tenantID, receivedTenantID)
	}
}
