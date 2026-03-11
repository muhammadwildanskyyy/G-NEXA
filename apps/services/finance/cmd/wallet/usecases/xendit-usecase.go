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
	SyncPendingPayments(ctx context.Context) error
}

type xenditUsecase struct {
	XenditService  services.XenditService
	PaymentUsecase PaymentUsecase
	WalletUsecase  WalletUsecase
	AnomalyService services.AnomalyService
}

func NewXenditUsecase(xenditService services.XenditService, paymentUsecase PaymentUsecase, walletUsecase WalletUsecase, anomalyService services.AnomalyService) XenditUsecase {
	return &xenditUsecase{
		XenditService:  xenditService,
		PaymentUsecase: paymentUsecase,
		WalletUsecase:  walletUsecase,
		AnomalyService: anomalyService,
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

		// Anomaly #6: TRANSACTION_NOT_FOUND
		xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_TRANSACTION_NOT_FOUND, model.SEVERITY_WARNING, "WEBHOOK",
			transactionID, "", fmt.Sprintf("Webhook received for unknown transaction: %s", transactionID),
			map[string]interface{}{"xendit_status": newStatus})

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

				// Anomaly #1: MISSING_USER_ID
				xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_MISSING_USER_ID, model.SEVERITY_CRITICAL, "WEBHOOK",
					transactionID, "", "TOPUP SUCCEEDED but user_id missing in Xendit metadata",
					map[string]interface{}{"amount": data.Amount})

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

				// Anomaly #3: INVALID_PAYLOAD
				xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_INVALID_PAYLOAD, model.SEVERITY_WARNING, "WEBHOOK",
					transactionID, userIDVal, "Failed to extract virtual_account data from webhook payload",
					map[string]interface{}{"amount": data.Amount})

				return errVaData
			}

			bankCode := vaData["channel_code"].(string)
			err = xu.WalletUsecase.AddBalance(ctx, userIDVal, data.Amount, bankCode)
			if err != nil {
				logger.Error(ctx, "usecase:webhook", "CRITICAL: Failed to add user balance", err, logrus.Fields{
					"transaction_id": transactionID,
					"target_user_id": userIDVal,
				})

				// Anomaly #2: BALANCE_ADD_FAILED — uang masuk tapi saldo tidak bertambah
				xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_BALANCE_ADD_FAILED, model.SEVERITY_CRITICAL, "WEBHOOK",
					transactionID, userIDVal, fmt.Sprintf("Payment SUCCEEDED but AddBalance failed: %s", err.Error()),
					map[string]interface{}{"amount": data.Amount, "bank_code": bankCode})

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

func (xu *xenditUsecase) SyncPendingPayments(ctx context.Context) error {
	logger.Info(ctx, "usecase:sync", "Starting payment status sync job", nil)

	// 1. Ambil semua payment PENDING yang sudah lebih dari 15 menit
	pendingPayments, err := xu.PaymentUsecase.GetStalePendingPayments(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:sync", "Failed to fetch stale pending payments", err, nil)
		return err
	}

	if len(pendingPayments) == 0 {
		logger.Info(ctx, "usecase:sync", "No stale pending payments found, skipping sync", nil)
		return nil
	}

	logger.Info(ctx, "usecase:sync", "Found stale pending payments to sync", logrus.Fields{
		"count": len(pendingPayments),
	})

	// 2. Loop setiap payment, cek status di Xendit
	for _, payment := range pendingPayments {
		xenditPayment, err := xu.XenditService.GetPaymentStatus(ctx, payment.TransactionID)
		if err != nil {
			logger.Error(ctx, "usecase:sync", "Failed to fetch Xendit status for payment", err, logrus.Fields{
				"transaction_id": payment.TransactionID,
			})
			continue // Lanjut ke payment berikutnya, jangan gagalkan semua
		}

		xenditStatus := string(xenditPayment.GetStatus())

		logger.Info(ctx, "usecase:sync", "Xendit status retrieved for payment", logrus.Fields{
			"transaction_id": payment.TransactionID,
			"xendit_status":  xenditStatus,
			"local_status":   payment.Status,
		})

		switch xenditStatus {
		case string(payment_request.PAYMENTREQUESTSTATUS_SUCCEEDED):
			// 3a. SUCCEEDED → Update status
			err = xu.PaymentUsecase.UpdateStatus(ctx, payment.TransactionID, xenditStatus)
			if err != nil {
				logger.Error(ctx, "usecase:sync", "Failed to update payment status to SUCCEEDED", err, logrus.Fields{
					"transaction_id": payment.TransactionID,
				})
				continue
			}

			// Cek tipe transaksi sebelum aksi lanjutan
			switch payment.TransactionType {
			case model.TRANSACTION_TYPE_TOPUP:
				// TOPUP → Tambah saldo wallet
				metadata := xenditPayment.GetMetadata()
				userID, ok := metadata["user_id"].(string)
				if !ok || userID == "" {
					logger.Error(ctx, "usecase:sync", "CRITICAL: Missing user_id in Xendit metadata for SUCCEEDED TOPUP", errors.New("missing user_id in metadata"), logrus.Fields{
						"transaction_id": payment.TransactionID,
					})

					// Anomaly #1: MISSING_USER_ID (via sync)
					xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_MISSING_USER_ID, model.SEVERITY_CRITICAL, "SYNC",
						payment.TransactionID, "", "TOPUP SUCCEEDED but user_id missing in Xendit metadata (detected by sync)",
						map[string]interface{}{"amount": payment.Amount})

					continue
				}

				bankCode := payment.ChannelCode

				logger.Info(ctx, "usecase:sync", "Executing balance addition for synced SUCCEEDED TOPUP", logrus.Fields{
					"transaction_id": payment.TransactionID,
					"target_user_id": userID,
					"amount":         payment.Amount,
					"bank_code":      bankCode,
				})

				err = xu.WalletUsecase.AddBalance(ctx, userID, payment.Amount, bankCode)
				if err != nil {
					logger.Error(ctx, "usecase:sync", "CRITICAL: Failed to add balance for synced TOPUP payment", err, logrus.Fields{
						"transaction_id": payment.TransactionID,
						"target_user_id": userID,
					})

					// Anomaly #2: BALANCE_ADD_FAILED (via sync)
					xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_BALANCE_ADD_FAILED, model.SEVERITY_CRITICAL, "SYNC",
						payment.TransactionID, userID, fmt.Sprintf("Synced TOPUP SUCCEEDED but AddBalance failed: %s", err.Error()),
						map[string]interface{}{"amount": payment.Amount, "bank_code": bankCode})

					continue
				}

				logger.Info(ctx, "usecase:sync", "Successfully synced and credited TOPUP payment", logrus.Fields{
					"transaction_id": payment.TransactionID,
					"target_user_id": userID,
				})

			case model.TRANSACTION_TYPE_ORDER:
				// ORDER → Log saja, bisa dipublish ke Kafka di masa depan
				logger.Info(ctx, "usecase:sync", "ORDER payment SUCCEEDED via sync, preparing for further processing", logrus.Fields{
					"transaction_id": payment.TransactionID,
				})

			default:
				logger.Warn(ctx, "usecase:sync", "Unknown transaction type for SUCCEEDED payment", logrus.Fields{
					"transaction_id":   payment.TransactionID,
					"transaction_type": payment.TransactionType,
				})

				// Anomaly #4: UNKNOWN_TRANSACTION_TYPE
				xu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_UNKNOWN_TX_TYPE, model.SEVERITY_WARNING, "SYNC",
					payment.TransactionID, "", fmt.Sprintf("SUCCEEDED payment has unknown transaction type: %s", payment.TransactionType),
					map[string]interface{}{"amount": payment.Amount, "transaction_type": payment.TransactionType})
			}

		case string(payment_request.PAYMENTREQUESTSTATUS_EXPIRED):
			// 3b. EXPIRED → Update status di database
			err = xu.PaymentUsecase.UpdateStatus(ctx, payment.TransactionID, "EXPIRED")
			if err != nil {
				logger.Error(ctx, "usecase:sync", "Failed to update payment status to EXPIRED", err, logrus.Fields{
					"transaction_id": payment.TransactionID,
				})
				continue
			}

			logger.Info(ctx, "usecase:sync", "Payment marked as EXPIRED after Xendit sync", logrus.Fields{
				"transaction_id": payment.TransactionID,
			})

		case string(payment_request.PAYMENTREQUESTSTATUS_FAILED):
			// 3c. FAILED → Update status di database
			err = xu.PaymentUsecase.UpdateStatus(ctx, payment.TransactionID, "FAILED")
			if err != nil {
				logger.Error(ctx, "usecase:sync", "Failed to update payment status to FAILED", err, logrus.Fields{
					"transaction_id": payment.TransactionID,
				})
				continue
			}

			logger.Info(ctx, "usecase:sync", "Payment marked as FAILED after Xendit sync", logrus.Fields{
				"transaction_id": payment.TransactionID,
			})

		default:
			// PENDING, REQUIRING_ACTION → Skip, biarkan Xendit yang process
			logger.Debug(ctx, "usecase:sync", "Payment still in non-final state on Xendit, skipping", logrus.Fields{
				"transaction_id": payment.TransactionID,
				"xendit_status":  xenditStatus,
			})
		}
	}

	logger.Info(ctx, "usecase:sync", "Payment status sync job completed", logrus.Fields{
		"processed_count": len(pendingPayments),
	})

	return nil
}
