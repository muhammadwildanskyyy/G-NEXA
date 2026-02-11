package repositories

import (
	"context"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"media-service/infrastructure/logger"
	"media-service/model"
	"time"
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
	logFields := logrus.Fields{
		"layer":    "Repository",
		"func":     "Create",
		"filename": media.FileName,
	}

	now := time.Now()
	media.CreatedAt = now
	media.UpdatedAt = now

	err := r.DB.WithContext(ctx).Create(media).Error
	if err != nil {
		logger.LogError(logFields, "Failed to create media metadata", "r.DB.Create()", err)
		return nil, err
	}

	return media, nil
}

func (r *mediaRepository) FindByID(ctx context.Context, id string) (*model.Media, error) {
	logFields := logrus.Fields{
		"layer":    "Repository",
		"func":     "FindByID",
		"media_id": id,
	}

	validID, err := uuid.Parse(id)
	if err != nil {
		logger.LogError(logFields, "Invalid UUID format", "uuid.Parse()", err)
		return nil, err
	}

	var media model.Media
	err = r.DB.WithContext(ctx).Where("id = ?", validID).First(&media).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			logger.Log.WithFields(logFields).Warn("Media record not found")
			return nil, err
		}
		logger.LogError(logFields, "Error find media by ID", "r.DB.First()", err)
		return nil, err
	}

	return &media, nil
}

func (r *mediaRepository) Delete(ctx context.Context, media *model.Media) error {
	logFields := logrus.Fields{
		"layer":    "Repository",
		"func":     "Delete",
		"media_id": media.ID,
	}

	err := r.DB.WithContext(ctx).Delete(media).Error
	if err != nil {
		logger.LogError(logFields, "Failed to delete media from database", "r.DB.Delete()", err)
		return err
	}

	return nil
}
