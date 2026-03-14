package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Anomaly type constants
const (
	ANOMALY_MISSING_USER_ID        = "MISSING_USER_ID"
	ANOMALY_BALANCE_ADD_FAILED     = "BALANCE_ADD_FAILED"
	ANOMALY_INVALID_PAYLOAD        = "INVALID_PAYLOAD"
	ANOMALY_UNKNOWN_TX_TYPE        = "UNKNOWN_TRANSACTION_TYPE"
	ANOMALY_BALANCE_MISMATCH       = "BALANCE_MISMATCH"
	ANOMALY_TRANSACTION_NOT_FOUND  = "TRANSACTION_NOT_FOUND"
	ANOMALY_WALLET_DEDUCT_FAILED   = "WALLET_DEDUCT_FAILED"
	ANOMALY_WALLET_INSUFFICIENT    = "WALLET_INSUFFICIENT_BALANCE"
)

// Anomaly severity constants
const (
	SEVERITY_CRITICAL = "CRITICAL"
	SEVERITY_WARNING  = "WARNING"
	SEVERITY_INFO     = "INFO"
)

type PaymentAnomaly struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	TransactionID string `gorm:"type:varchar(100);index" json:"transaction_id"`
	UserID        string `gorm:"type:varchar(100);index" json:"user_id"`

	AnomalyType string `gorm:"type:varchar(50);not null;index" json:"anomaly_type"`
	Severity    string `gorm:"type:varchar(20);not null" json:"severity"`
	Description string `gorm:"type:text;not null" json:"description"`
	Metadata    string `gorm:"type:jsonb;default:'{}'" json:"metadata"` // JSON string

	Resolved   bool       `gorm:"default:false" json:"resolved"`
	ResolvedAt *time.Time `json:"resolved_at"`
	ResolvedBy string     `gorm:"type:varchar(100)" json:"resolved_by"`

	Source string `gorm:"type:varchar(50);not null" json:"source"` // WEBHOOK, SYNC, RECONCILIATION, EXPIRY

	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (PaymentAnomaly) TableName() string {
	return "payment_anomalies"
}
