package services

import (
	"context"
	"errors"
	"time"

	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/repositories"
	"finance/infrastructure/logger"
	"finance/model"
)

type PaymentService interface {
	SavePaymentRecord(ctx context.Context, record *model.Payment) error
	GetPaymentRecord(ctx context.Context, transactionID string) (*model.Payment, error)
	RemovePaymentRecord(ctx context.Context, transactionID string) error
	UpdatePaymentStatus(ctx context.Context, transactionID string, status string) error
	GetStalePendingPayments(ctx context.Context) ([]model.Payment, error)
	GetExpiredPendingPayments(ctx context.Context) ([]model.Payment, error)
	GetSucceededPaymentTotalsByUser(ctx context.Context) ([]model.UserPaymentTotals, error)
}

type paymentService struct {
	paymentRepository repositories.PaymentRepository
}

func NewPaymentService(repo repositories.PaymentRepository) PaymentService {
	return &paymentService{paymentRepository: repo}
}

func (s *paymentService) SavePaymentRecord(ctx context.Context, record *model.Payment) error {
	if record.Amount <= 0 {
		logger.Warn(ctx, "service:payment", "Attempted to save payment with invalid amount", logrus.Fields{
			"transaction_id": record.TransactionID,
			"amount":         record.Amount,
		})
		return errors.New("invalid payment amount")
	}

	return s.paymentRepository.Save(ctx, record)
}

func (s *paymentService) GetPaymentRecord(ctx context.Context, transactionID string) (*model.Payment, error) {
	if transactionID == "" {
		logger.Warn(ctx, "service:payment", "Attempted to fetch payment with empty transaction ID", nil)
		return nil, errors.New("transaction ID cannot be empty")
	}

	return s.paymentRepository.GetByTransactionID(ctx, transactionID)
}

func (s *paymentService) RemovePaymentRecord(ctx context.Context, transactionID string) error {
	if transactionID == "" {
		logger.Warn(ctx, "service:payment", "Attempted to remove payment with empty transaction ID", nil)
		return errors.New("transaction ID cannot be empty")
	}

	record, err := s.paymentRepository.GetByTransactionID(ctx, transactionID)
	if err != nil {
		return err
	}

	if record.Status == "SUCCEEDED" {
		logger.Warn(ctx, "service:payment", "Attempted to remove a succeeded payment record", logrus.Fields{
			"transaction_id": transactionID,
		})
		return errors.New("cannot remove a succeeded payment record")
	}

	return s.paymentRepository.Delete(ctx, transactionID)
}

func (s *paymentService) UpdatePaymentStatus(ctx context.Context, transactionID string, status string) error {
	if transactionID == "" {
		logger.Warn(ctx, "service:payment", "Attempted to update status with empty transaction ID", nil)
		return errors.New("transaction ID cannot be empty")
	}
	if status == "" {
		logger.Warn(ctx, "service:payment", "Attempted to update payment with empty status", logrus.Fields{
			"transaction_id": transactionID,
		})
		return errors.New("status cannot be empty")
	}

	return s.paymentRepository.UpdateStatus(ctx, transactionID, status)
}

func (s *paymentService) GetStalePendingPayments(ctx context.Context) ([]model.Payment, error) {
	threshold := time.Now().Add(-15 * time.Minute)

	logger.Debug(ctx, "service:payment", "Fetching stale pending payments", logrus.Fields{
		"threshold": threshold.Format(time.RFC3339),
	})

	records, err := s.paymentRepository.GetStalePendingPayments(ctx, threshold)
	if err != nil {
		logger.Error(ctx, "service:payment", "Failed to fetch stale pending payments", err, nil)
		return nil, err
	}

	return records, nil
}

func (s *paymentService) GetExpiredPendingPayments(ctx context.Context) ([]model.Payment, error) {
	logger.Debug(ctx, "service:payment", "Fetching expired pending payments", nil)

	records, err := s.paymentRepository.GetExpiredPendingPayments(ctx)
	if err != nil {
		logger.Error(ctx, "service:payment", "Failed to fetch expired pending payments", err, nil)
		return nil, err
	}

	return records, nil
}

func (s *paymentService) GetSucceededPaymentTotalsByUser(ctx context.Context) ([]model.UserPaymentTotals, error) {
	logger.Debug(ctx, "service:payment", "Fetching succeeded payment totals by user", nil)

	totals, err := s.paymentRepository.GetSucceededPaymentTotalsByUser(ctx)
	if err != nil {
		logger.Error(ctx, "service:payment", "Failed to fetch payment totals", err, nil)
		return nil, err
	}

	return totals, nil
}
