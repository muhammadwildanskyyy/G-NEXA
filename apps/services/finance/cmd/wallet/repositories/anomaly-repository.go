package repositories

import (
	"context"

	"gorm.io/gorm"

	"finance/infrastructure/logger"
	"finance/model"
)

type AnomalyRepository interface {
	SaveAnomaly(ctx context.Context, anomaly *model.PaymentAnomaly) error
}

type anomalyRepository struct {
	db *gorm.DB
}

func NewAnomalyRepository(db *gorm.DB) AnomalyRepository {
	return &anomalyRepository{db: db}
}

func (r *anomalyRepository) SaveAnomaly(ctx context.Context, anomaly *model.PaymentAnomaly) error {
	err := r.db.WithContext(ctx).Create(anomaly).Error
	if err != nil {
		logger.Error(ctx, "repository:anomaly", "Failed to save payment anomaly", err, nil)
		return err
	}

	return nil
}
