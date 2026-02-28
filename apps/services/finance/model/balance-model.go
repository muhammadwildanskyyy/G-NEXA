package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

const (
	WalletStatusActive    string = "ACTIVE"
	WalletStatusSuspended string = "SUSPENDED"
	WalletStatusFrozen    string = "FROZEN"
)

type Wallet struct {
	ID     uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID string    `gorm:"type:varchar(100);uniqueIndex:idx_user_currency;not null" json:"user_id"`

	// Pemisahan Saldo
	AvailableBalance decimal.Decimal `gorm:"type:numeric(15,2);default:0.00;not null" json:"available_balance"`
	PendingBalance   decimal.Decimal `gorm:"type:numeric(15,2);default:0.00;not null" json:"pending_balance"`

	// Konfigurasi Tambahan
	Currency string `gorm:"type:varchar(3);uniqueIndex:idx_user_currency;default:'IDR';not null" json:"currency"`
	Status   string `gorm:"type:varchar(20);default:'ACTIVE';not null" json:"status"`

	// Timestamp
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Wallet) TableName() string {
	return "wallets"
}
