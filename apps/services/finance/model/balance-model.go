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
	ID     uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID string    `gorm:"type:varchar(100);uniqueIndex:idx_user_currency;not null"`

	// Pemisahan Saldo
	AvailableBalance decimal.Decimal `gorm:"type:numeric(15,2);default:0.00;not null"`
	PendingBalance   decimal.Decimal `gorm:"type:numeric(15,2);default:0.00;not null"`

	// Konfigurasi Tambahan
	Currency string `gorm:"type:varchar(3);uniqueIndex:idx_user_currency;default:'IDR';not null"`
	Status   string `gorm:"type:varchar(20);default:'ACTIVE';not null"`

	// Timestamp
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (Wallet) TableName() string {
	return "wallets"
}
