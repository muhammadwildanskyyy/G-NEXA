package services

import (
	"context"
	"errors"

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
