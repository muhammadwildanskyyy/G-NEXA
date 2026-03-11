package repositories

import (
	"context"
	"errors"

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
