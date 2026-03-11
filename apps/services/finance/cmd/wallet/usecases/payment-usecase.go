package usecases

import (
	"context"

	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/services"
	"finance/infrastructure/logger"
	"finance/model"
)

type PaymentUsecase interface {
	SavePayment(ctx context.Context, input *model.CreatePaymentInput) error
	GetRecord(ctx context.Context, transactionID string) (*model.Payment, error)
	CancelPayment(ctx context.Context, transactionID string) error
	UpdateStatus(ctx context.Context, transactionID string, status string) error
}

type paymentUsecase struct {
	paymentService services.PaymentService
}

func NewPaymentUsecase(paymentService services.PaymentService) PaymentUsecase {
	return &paymentUsecase{
		paymentService: paymentService,
	}
}

func (u *paymentUsecase) SavePayment(ctx context.Context, input *model.CreatePaymentInput) error {
	logger.Debug(ctx, "usecase:payment", "Preparing to save new payment record", logrus.Fields{
		"transaction_id":   input.TransactionID,
		"transaction_type": input.TransactionType,
	})

	record := &model.Payment{
		TransactionID:      input.TransactionID,
		TransactionType:    input.TransactionType,
		XenditPaymentReqID: input.XenditPaymentReqID,
		Amount:             input.Amount,
		Currency:           "IDR",
		MethodType:         input.MethodType,
		ChannelCode:        input.ChannelCode,
		PaymentActionInfo:  input.PaymentActionInfo,
		Status:             "PENDING",
		ExpiresAt:          input.ExpiresAt,
	}

	err := u.paymentService.SavePaymentRecord(ctx, record)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to save payment record", err, logrus.Fields{
			"transaction_id": input.TransactionID,
		})
		return err
	}

	logger.Info(ctx, "usecase:payment", "Successfully saved new payment record", logrus.Fields{
		"transaction_id": input.TransactionID,
	})

	return nil
}

func (u *paymentUsecase) GetRecord(ctx context.Context, transactionID string) (*model.Payment, error) {
	logger.Debug(ctx, "usecase:payment", "Fetching payment record", logrus.Fields{
		"transaction_id": transactionID,
	})

	record, err := u.paymentService.GetPaymentRecord(ctx, transactionID)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to fetch payment record", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return nil, err
	}

	return record, nil
}

func (u *paymentUsecase) CancelPayment(ctx context.Context, transactionID string) error {
	logger.Debug(ctx, "usecase:payment", "Attempting to cancel payment", logrus.Fields{
		"transaction_id": transactionID,
	})

	err := u.paymentService.RemovePaymentRecord(ctx, transactionID)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to cancel payment", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return err
	}

	logger.Info(ctx, "usecase:payment", "Successfully canceled payment", logrus.Fields{
		"transaction_id": transactionID,
	})

	return nil
}

func (u *paymentUsecase) UpdateStatus(ctx context.Context, transactionID string, status string) error {
	logger.Debug(ctx, "usecase:payment", "Updating payment status", logrus.Fields{
		"transaction_id": transactionID,
		"target_status":  status,
	})

	err := u.paymentService.UpdatePaymentStatus(ctx, transactionID, status)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to update payment status", err, logrus.Fields{
			"transaction_id": transactionID,
			"target_status":  status,
		})
		return err
	}

	logger.Info(ctx, "usecase:payment", "Successfully updated payment status", logrus.Fields{
		"transaction_id": transactionID,
		"target_status":  status,
	})

	return nil
}
