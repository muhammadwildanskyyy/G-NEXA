package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"

	"media-service/infrastructure/logger" // Sesuaikan path GNEXA logger Anda
	"media-service/model"
)

type MediaRepository interface {
	Create(ctx context.Context, media *model.Media) (*model.Media, error)
	FindByID(ctx context.Context, id string) (*model.Media, error)
	Delete(ctx context.Context, media *model.Media) error
}

type mediaRepository struct {
	DB *gorm.DB
}

func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &mediaRepository{DB: db}
}

func (r *mediaRepository) Create(ctx context.Context, media *model.Media) (*model.Media, error) {
	now := time.Now()
	media.CreatedAt = now
	media.UpdatedAt = now

	// 🚀 WithContext(ctx) memastikan GORM GNEXA Adapter mencetak query dengan Trace ID!
	err := r.DB.WithContext(ctx).Create(media).Error
	if err != nil {
		// Gunakan helper Error standar GNEXA
		logger.Error(ctx, "repository:media", "Failed to create media metadata in database", err, logrus.Fields{
			"file_name": media.FileName,
		})
		return nil, err
	}

	return media, nil
}

func (r *mediaRepository) FindByID(ctx context.Context, id string) (*model.Media, error) {
	validID, err := uuid.Parse(id)
	if err != nil {
		// Invalid format adalah kesalahan input (Client Error), jadi gunakan Warn
		logger.Warn(ctx, "repository:media", "Invalid UUID format provided", logrus.Fields{
			"media_id": id,
			"error":    err.Error(),
		})
		return nil, err
	}

	var media model.Media
	err = r.DB.WithContext(ctx).Where("id = ?", validID).First(&media).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Data tidak ditemukan adalah hal lumrah di bisnis logik, gunakan Debug agar production senyap
			logger.Debug(ctx, "repository:media", "Media record not found in database", logrus.Fields{
				"media_id": id,
			})
			return nil, err
		}

		// Jika error selain tidak ketemu (misal koneksi putus), gunakan Error
		logger.Error(ctx, "repository:media", "Failed to find media by ID", err, logrus.Fields{
			"media_id": id,
		})
		return nil, err
	}

	return &media, nil
}

func (r *mediaRepository) Delete(ctx context.Context, media *model.Media) error {
	err := r.DB.WithContext(ctx).Delete(media).Error
	if err != nil {
		logger.Error(ctx, "repository:media", "Failed to delete media from database", err, logrus.Fields{
			"media_id": media.ID, // Pastikan media.ID memiliki nilai
		})
		return err
	}

	return nil
}
