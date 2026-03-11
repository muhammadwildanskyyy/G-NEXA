package model

import "time"

const (
	TRANSACTION_TYPE_ORDER = "ORDER"
	TRANSACTION_TYPE_TOPUP = "TOPUP"

	PAYMENT_METHOD_VA   = "VA"
	PAYMENT_METHOD_QRIS = "QRIS"
)

type CreateVAParam struct {
	UserID         string `json:"user_id"`
	TransactionID  string
	IdempotencyKey string
	Amount         float64
	BankCode       string
	CustomerName   string
	Description    string
}

type PaymentResponse struct {
	PaymentID     string    `json:"payment_id"`
	TransactionID string    `json:"transaction_id"`
	Status        string    `json:"status"`
	VANumber      string    `json:"va_number"`
	BankCode      string    `json:"bank_code"`
	FinalAmount   float64   `json:"final_amount"`
	ExpiresAt     time.Time `json:"expires_at"`
}

type PaymentCallback struct {
	Event      string               `json:"event"`
	BusinessId string               `json:"business_id"`
	Created    string               `json:"created"`
	Data       *PaymentCallbackData `json:"data"`
}

// PaymentCallbackData adalah isi detail transaksinya
type PaymentCallbackData struct {
	Id               string  `json:"id"`
	PaymentRequestId *string `json:"payment_request_id"`
	ReferenceId      string  `json:"reference_id"`
	CustomerId       *string `json:"customer_id"`
	Currency         string  `json:"currency"`
	Amount           float64 `json:"amount"`
	Country          string  `json:"country"`
	Status           string  `json:"status"`

	PaymentMethod     map[string]interface{} `json:"payment_method"`
	ChannelProperties map[string]interface{} `json:"channel_properties"`
	PaymentDetail     map[string]interface{} `json:"payment_detail"`

	FailureCode *string `json:"failure_code"`
	Created     string  `json:"created"`
	Updated     string  `json:"updated"`

	Metadata map[string]interface{} `json:"metadata"`
}
