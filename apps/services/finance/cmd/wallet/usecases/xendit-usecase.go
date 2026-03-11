package usecases

import (
	"context"
	"errors"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/xendit/xendit-go/v7/payment_request"

	"finance/cmd/wallet/services"
	"finance/infrastructure/logger"
	"finance/model"
)

type XenditUsecase interface {
	CreatePaymentRequest(ctx context.Context, userId string, TransactionID string, amount float64, bankCode string, customerName string) (*model.PaymentResponse, error)
	ProcessPaymentCallback(ctx context.Context, payload model.PaymentCallback) error
}

type xenditUsecase struct {
	XenditService  services.XenditService
	PaymentUsecase PaymentUsecase
	WalletUsecase  WalletUsecase
}

func NewXenditUsecase(xenditService services.XenditService, paymentUsecase PaymentUsecase, walletUsecase WalletUsecase) XenditUsecase {
	return &xenditUsecase{
		XenditService:  xenditService,
		PaymentUsecase: paymentUsecase,
		WalletUsecase:  walletUsecase,
	}
}

func (xu *xenditUsecase) CreatePaymentRequest(ctx context.Context, userId string, TransactionID string, amount float64, bankCode string, customerName string) (*model.PaymentResponse, error) {
	gatewayResp, err := xu.XenditService.GenerateVABill(ctx, userId, TransactionID, TransactionID, amount, bankCode, customerName)
	if err != nil {
		return nil, err
	}

	return gatewayResp, nil
}

func (xu *xenditUsecase) ProcessPaymentCallback(ctx context.Context, payload model.PaymentCallback) error {
	data := payload.Data
	transactionID := data.ReferenceId
	newStatus := data.Status

	logger.Info(ctx, "usecase:webhook", "Initiating payment callback processing", logrus.Fields{
		"transaction_id": transactionID,
		"status_xendit":  newStatus,
	})

	paymentRecord, err := xu.PaymentUsecase.GetRecord(ctx, transactionID)
	if err != nil {
		logger.Error(ctx, "usecase:webhook", "Payment transaction data not found", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return fmt.Errorf("transaction %s not found: %w", transactionID, err)
	}

	if paymentRecord.Status == "SUCCEEDED" || paymentRecord.Status == "FAILED" {
		logger.Info(ctx, "usecase:webhook", "Webhook ignored, transaction is already in final state", logrus.Fields{
			"transaction_id": transactionID,
			"current_status": paymentRecord.Status,
		})
		return nil
	}

	err = xu.PaymentUsecase.UpdateStatus(ctx, transactionID, newStatus)
	if err != nil {
		logger.Error(ctx, "usecase:webhook", "Failed to update transaction status", err, logrus.Fields{
			"transaction_id": transactionID,
			"target_status":  newStatus,
		})
		return err
	}

	if newStatus == string(payment_request.PAYMENTREQUESTSTATUS_SUCCEEDED) {
		switch paymentRecord.TransactionType {
		case model.TRANSACTION_TYPE_TOPUP:
			userIDVal, ok := data.Metadata["user_id"].(string)
			if !ok || userIDVal == "" {
				errMissingUserID := errors.New("missing user_id in metadata")
				logger.Error(ctx, "usecase:webhook", "Missing user_id in webhook metadata", errMissingUserID, logrus.Fields{
					"transaction_id": transactionID,
				})
				return fmt.Errorf("missing user_id for topup transaction %s", transactionID)
			}

			logger.Info(ctx, "usecase:webhook", "Executing balance addition via Wallet Usecase", logrus.Fields{
				"target_user_id": userIDVal,
				"amount":         data.Amount,
			})

			vaData, ok := data.PaymentMethod["virtual_account"].(map[string]interface{})
			if !ok {
				errVaData := errors.New("failed to extract virtual account data")
				logger.Error(ctx, "usecase:webhook", "Invalid payload structure for VA data", errVaData, logrus.Fields{
					"transaction_id": transactionID,
				})
				return errVaData
			}

			bankCode := vaData["channel_code"].(string)
			err = xu.WalletUsecase.AddBalance(ctx, userIDVal, data.Amount, bankCode)
			if err != nil {
				logger.Error(ctx, "usecase:webhook", "CRITICAL: Failed to add user balance", err, logrus.Fields{
					"transaction_id": transactionID,
					"target_user_id": userIDVal,
				})
				return err
			}

			logger.Info(ctx, "usecase:webhook", "Wallet top-up completed successfully", logrus.Fields{
				"transaction_id": transactionID,
				"target_user_id": userIDVal,
			})

		case model.TRANSACTION_TYPE_ORDER:
			logger.Info(ctx, "usecase:webhook", "ORDER payment successful, preparing to publish Kafka event", logrus.Fields{
				"transaction_id": transactionID,
			})
		}
	}

	return nil
}
