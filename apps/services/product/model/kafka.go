package model

type OrderEventMessage[T any] struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
	Data      T      `json:"data"`
}

type InvoiceCreatedEventData struct {
	InvoiceID     string       `json:"invoice_id"`
	UserID        string       `json:"user_id"`
	CustomerName  string       `json:"customer_name"`
	TotalAmount   float64      `json:"total_amount"`
	OrderIDs      []string     `json:"order_ids"`
	PaymentMethod string       `json:"payment_method"`
	BankCode      string       `json:"bank_code,omitempty"`
	OrderItems    []*OrderItem `json:"order_items"`
}

type OrderItem struct {
	ProductId       string `json:"product_id"`
	Quantity        int    `json:"quantity"`
	PriceAtPurchase int64  `json:"price_at_purchase"`
}

type OrderCancelledEventData struct {
	InvoiceID  string       `json:"invoice_id"`
	UserID     string       `json:"user_id"`
	OrderIDs   []string     `json:"order_ids"`
	OrderItems []*OrderItem `json:"order_items"`
}
