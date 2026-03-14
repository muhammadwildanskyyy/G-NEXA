package services

import (
	"context"
	"errors"

	"github.com/sirupsen/logrus"
	"github.com/xendit/xendit-go/v7/payment_request"

	"finance/cmd/wallet/repositories"
	"finance/constant"
	"finance/infrastructure/logger"
	"finance/model"
)

type XenditService interface {
	GenerateVABill(ctx context.Context, userId string, TransactionID string, idempotencyKey string, rawAmount float64, bankCode string, customerName string) (*model.PaymentResponse, error)
	GetPaymentStatus(ctx context.Context, referenceID string) (*payment_request.PaymentRequest, error)
}

type xenditService struct {
	XenditRepository repositories.XenditRepository
}

func NewXenditService(xenditRepository repositories.XenditRepository) XenditService {
	return &xenditService{
		XenditRepository: xenditRepository,
	}
}

func (xs *xenditService) GenerateVABill(ctx context.Context, userId string, TransactionID string, idempotencyKey string, rawAmount float64, bankCode string, customerName string) (*model.PaymentResponse, error) {
	if userId == "" {
		logger.Warn(ctx, "service:xendit", "Attempted to generate VA bill with empty user ID", nil)
		return nil, errors.New("user ID cannot be empty")
	}

	if TransactionID == "" {
		logger.Warn(ctx, "service:xendit", "Attempted to generate VA bill with empty transaction ID", nil)
		return nil, errors.New("transaction ID cannot be empty")
	}

	if rawAmount <= 0 {
		logger.Warn(ctx, "service:xendit", "Attempted to generate VA bill with invalid amount", logrus.Fields{
			"target_user_id": userId,
			"raw_amount":     rawAmount,
		})
		return nil, errors.New("raw amount must be greater than zero")
	}

	finalAmount := rawAmount
	switch bankCode {
	case string(payment_request.VIRTUALACCOUNTCHANNELCODE_BCA):
		finalAmount += constant.BCA_ADMIN_FEE
	case string(payment_request.VIRTUALACCOUNTCHANNELCODE_MANDIRI):
		finalAmount += constant.MANDIRI_ADMIN_FEE
	case string(payment_request.VIRTUALACCOUNTCHANNELCODE_BRI):
		finalAmount += constant.BRI_ADMIN_FEE
	}

	param := &model.CreateVAParam{
		UserID:         userId,
		TransactionID:  TransactionID,
		Amount:         finalAmount,
		BankCode:       bankCode,
		CustomerName:   customerName,
		IdempotencyKey: idempotencyKey,
	}

	logger.Debug(ctx, "service:xendit", "Delegating VA bill generation to repository", logrus.Fields{
		"target_user_id": userId,
		"transaction_id": TransactionID,
		"bank_code":      bankCode,
		"final_amount":   finalAmount,
	})

	resp, err := xs.XenditRepository.CreatePaymentWithVA(ctx, param)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:xendit", "Successfully generated VA bill", logrus.Fields{
		"target_user_id": userId,
		"transaction_id": TransactionID,
		"va_number":      resp.VANumber,
	})

	return resp, nil
}

func (xs *xenditService) GetPaymentStatus(ctx context.Context, referenceID string) (*payment_request.PaymentRequest, error) {
	if referenceID == "" {
		logger.Warn(ctx, "service:xendit", "Attempted to get payment status with empty reference ID", nil)
		return nil, errors.New("reference ID cannot be empty")
	}

	logger.Debug(ctx, "service:xendit", "Fetching payment status from Xendit", logrus.Fields{
		"reference_id": referenceID,
	})

	result, err := xs.XenditRepository.GetPaymentByReferenceID(ctx, []string{referenceID})
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:xendit", "Successfully fetched payment status from Xendit", logrus.Fields{
		"reference_id": referenceID,
		"status":       result.GetStatus(),
	})

	return result, nil
}
