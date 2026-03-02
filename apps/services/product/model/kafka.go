package model

type OrderEventMessage[T any] struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
	Data      T      `json:"data"`
}

type OrderCreatedEventData struct {
	OrderItems []*OrderItem `json:"order_items"`
}

type OrderItem struct {
	Id              string `json:"id,omitempty"`
	ProductId       string `json:"product_id"`
	Quantity        int    `json:"quantity"`
	PriceAtPurchase int64  `json:"price_at_purchase"` // <-- Ubah ke int64 karena bentuknya angka di JSON
	CreatedAt       string `json:"created_at,omitempty"`
	UpdatedAt       string `json:"updated_at,omitempty"`
}
