package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"

	"finance/infrastructure/logger"
	"finance/model"
)

type PaymentRepository interface {
	Save(ctx context.Context, record *model.Payment) error
	GetByTransactionID(ctx context.Context, transactionID string) (*model.Payment, error)
	Delete(ctx context.Context, transactionID string) error
	UpdateStatus(ctx context.Context, transactionID string, status string) error
	Update(ctx context.Context, record *model.Payment) error
	GetStalePendingPayments(ctx context.Context, threshold time.Time) ([]model.Payment, error)
	GetExpiredPendingPayments(ctx context.Context) ([]model.Payment, error)
	GetSucceededPaymentTotalsByUser(ctx context.Context) ([]model.UserPaymentTotals, error)
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db: db}
}

func (pr *paymentRepository) Save(ctx context.Context, record *model.Payment) error {
	err := pr.db.WithContext(ctx).Create(record).Error
	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to save payment record", err, logrus.Fields{
			"transaction_id": record.TransactionID,
		})
		return err
	}

	logger.Debug(ctx, "repository:payment", "Successfully saved payment record", logrus.Fields{
		"transaction_id": record.TransactionID,
	})
	return nil
}

func (pr *paymentRepository) GetByTransactionID(ctx context.Context, transactionID string) (*model.Payment, error) {
	var record model.Payment
	err := pr.db.WithContext(ctx).Where("transaction_id = ?", transactionID).First(&record).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Debug(ctx, "repository:payment", "Payment record not found", logrus.Fields{
				"transaction_id": transactionID,
			})
			return nil, errors.New("payment record not found")
		}
		logger.Error(ctx, "repository:payment", "Failed to fetch payment record", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return nil, err
	}

	return &record, nil
}

func (pr *paymentRepository) Delete(ctx context.Context, transactionID string) error {
	err := pr.db.WithContext(ctx).Where("transaction_id = ?", transactionID).Delete(&model.Payment{}).Error
	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to delete payment record", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return err
	}

	logger.Debug(ctx, "repository:payment", "Successfully deleted payment record", logrus.Fields{
		"transaction_id": transactionID,
	})
	return nil
}

func (pr *paymentRepository) UpdateStatus(ctx context.Context, transactionID string, status string) error {
	err := pr.db.WithContext(ctx).
		Model(&model.Payment{}).
		Where("transaction_id = ?", transactionID).
		Update("status", status).Error

	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to update payment status", err, logrus.Fields{
			"transaction_id": transactionID,
			"target_status":  status,
		})
		return err
	}

	logger.Debug(ctx, "repository:payment", "Successfully updated payment status", logrus.Fields{
		"transaction_id": transactionID,
		"target_status":  status,
	})
	return nil
}

func (pr *paymentRepository) Update(ctx context.Context, record *model.Payment) error {
	err := pr.db.WithContext(ctx).
		Model(&model.Payment{}).
		Where("transaction_id = ?", record.TransactionID).
		Updates(record).Error

	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to update payment record", err, logrus.Fields{
			"transaction_id": record.TransactionID,
		})
		return err
	}

	logger.Debug(ctx, "repository:payment", "Successfully updated payment record", logrus.Fields{
		"transaction_id": record.TransactionID,
	})
	return nil
}

func (pr *paymentRepository) GetStalePendingPayments(ctx context.Context, threshold time.Time) ([]model.Payment, error) {
	var records []model.Payment

	err := pr.db.WithContext(ctx).
		Where("status = ? AND created_at < ?", "PENDING", threshold).
		Find(&records).Error

	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to fetch stale pending payments", err, nil)
		return nil, err
	}

	logger.Debug(ctx, "repository:payment", "Fetched stale pending payments", logrus.Fields{
		"count":     len(records),
		"threshold": threshold.Format(time.RFC3339),
	})

	return records, nil
}

func (pr *paymentRepository) GetExpiredPendingPayments(ctx context.Context) ([]model.Payment, error) {
	var records []model.Payment

	err := pr.db.WithContext(ctx).
		Where("status = ? AND expires_at < ?", "PENDING", time.Now()).
		Find(&records).Error

	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to fetch expired pending payments", err, nil)
		return nil, err
	}

	logger.Debug(ctx, "repository:payment", "Fetched expired pending payments", logrus.Fields{
		"count": len(records),
	})

	return records, nil
}

func (pr *paymentRepository) GetSucceededPaymentTotalsByUser(ctx context.Context) ([]model.UserPaymentTotals, error) {
	var results []model.UserPaymentTotals

	// transaction_id format: {TYPE}-{userID}-{timestamp}
	// Extract user_id by removing the first segment (TYPE-) and last segment (-timestamp)
	query := `
		SELECT 
			SUBSTRING(transaction_id FROM '-(.+)-[^-]+$') AS user_id,
			COALESCE(SUM(CASE WHEN transaction_type = 'TOPUP' THEN amount ELSE 0 END), 0) AS total_topup,
			COALESCE(SUM(CASE WHEN transaction_type = 'ORDER' THEN amount ELSE 0 END), 0) AS total_order
		FROM payments
		WHERE status = 'SUCCEEDED' AND deleted_at IS NULL
		GROUP BY SUBSTRING(transaction_id FROM '-(.+)-[^-]+$')
	`

	err := pr.db.WithContext(ctx).Raw(query).Scan(&results).Error
	if err != nil {
		logger.Error(ctx, "repository:payment", "Failed to fetch succeeded payment totals by user", err, nil)
		return nil, err
	}

	logger.Debug(ctx, "repository:payment", "Fetched succeeded payment totals by user", logrus.Fields{
		"user_count": len(results),
	})

	return results, nil
}
