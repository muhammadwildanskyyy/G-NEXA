package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Media struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	FileName  string    `gorm:"type:varchar(255)"`
	FileURL   string    `gorm:"type:text;not null"`
	PublicID  string    `gorm:"type:varchar(255);not null;uniqueIndex"` // Cloudinary ID
	MediaType string    `gorm:"type:varchar(50)"`                       // image/video
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (m *Media) BeforeCreate(tx *gorm.DB) (err error) {
	m.ID = uuid.New()
	return
}
