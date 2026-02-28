package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Media struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FileName  string    `gorm:"type:varchar(255)" json:"file_name"`
	FileURL   string    `gorm:"type:text;not null" json:"file_url"`
	PublicID  string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"public_id"`
	MediaType string    `gorm:"type:varchar(50)"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (m *Media) BeforeCreate(tx *gorm.DB) (err error) {
	m.ID = uuid.New()
	return
}

type DeleteBulkRequest struct {
	IDs []string `json:"ids"`
}
