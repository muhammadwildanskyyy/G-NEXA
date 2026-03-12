package model

import "context"

// EventPublisher abstracts Kafka event publishing to avoid import cycles
type EventPublisher interface {
	Publish(ctx context.Context, key string, payload interface{}) error
}

type UserEventMessage struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
	Data      struct {
		UserID string `json:"user_id"`
		Name   string `json:"name"`
		Email  string `json:"email"`
	} `json:"data"`
}

type InvoiceCreatedEvent struct {
	Event     string                  `json:"event"`
	Timestamp string                  `json:"timestamp"`
	Data      InvoiceCreatedEventData `json:"data"`
}

type InvoiceCreatedEventData struct {
	InvoiceID     string   `json:"invoice_id"`
	UserID        string   `json:"user_id"`
	CustomerName  string   `json:"customer_name"`
	TotalAmount   float64  `json:"total_amount"`
	OrderIDs      []string `json:"order_ids"`
	PaymentMethod string   `json:"payment_method"`
	BankCode      string   `json:"bank_code,omitempty"`
}

// PaymentEvent is published to payment.events topic
type PaymentEvent struct {
	Event     string           `json:"event"`
	Timestamp string           `json:"timestamp"`
	Data      PaymentEventData `json:"data"`
}

type PaymentEventData struct {
	TransactionID string  `json:"transaction_id"`
	InvoiceID     string  `json:"invoice_id"`
	UserID        string  `json:"user_id"`
	Amount        float64 `json:"amount"`
	Status        string  `json:"status"`
}
