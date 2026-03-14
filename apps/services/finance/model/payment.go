package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreatePaymentInput struct {
	UserID             string
	TransactionID      string
	TransactionType    string
	XenditPaymentReqID string
	Amount             float64
	MethodType         string
	ChannelCode        string
	PaymentActionInfo  string
	ExpiresAt          time.Time
}

type Payment struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	UserID string `gorm:"type:varchar(100);not null;index" json:"user_id"`

	TransactionID   string `gorm:"type:varchar(100);not null;index" json:"transaction_id"`
	TransactionType string `gorm:"type:varchar(20);not null" json:"transaction_type"`

	XenditPaymentReqID string `gorm:"type:varchar(100);uniqueIndex;not null" json:"xendit_payment_req_id"`

	Amount   float64 `gorm:"type:numeric(15,2);not null" json:"amount"`
	Currency string  `gorm:"type:varchar(10);default:'IDR'" json:"currency"`

	MethodType  string `gorm:"type:varchar(50);not null" json:"method_type"`
	ChannelCode string `gorm:"type:varchar(50);not null" json:"channel_code"`

	PaymentActionInfo string `gorm:"type:text" json:"payment_action_info"`

	Status string `gorm:"type:varchar(30);default:'PENDING';not null" json:"status"`

	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	PaidAt    *time.Time `json:"paid_at"`

	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Payment) TableName() string {
	return "payments"
}

// UserPaymentTotals holds aggregated SUCCEEDED payment totals per user
type UserPaymentTotals struct {
	UserID     string  `json:"user_id"`
	TotalTopUp float64 `json:"total_topup"`
	TotalOrder float64 `json:"total_order"`
}
