package usecases

import (
	"context"
	"fmt"
	"strings"
	"time"

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
	GetStalePendingPayments(ctx context.Context) ([]model.Payment, error)
	GetExpiredPendingPayments(ctx context.Context) ([]model.Payment, error)
	ExpireOldPayments(ctx context.Context) error
	GetSucceededPaymentTotalsByUser(ctx context.Context) ([]model.UserPaymentTotals, error)
	CreateOrderPayment(ctx context.Context, event model.InvoiceCreatedEventData) error
	GetMyPayments(ctx context.Context, userID string) ([]model.Payment, error)
	GetPaymentDetail(ctx context.Context, transactionID string) (*model.Payment, error)
	SetWalletUsecase(wu WalletUsecase)
}

type paymentUsecase struct {
	paymentService   services.PaymentService
	xenditService    services.XenditService
	walletUsecase    WalletUsecase
	anomalyService   services.AnomalyService
	paymentPublisher model.EventPublisher
}

func NewPaymentUsecase(paymentService services.PaymentService, xenditService services.XenditService, anomalyService services.AnomalyService, paymentPublisher model.EventPublisher) PaymentUsecase {
	return &paymentUsecase{
		paymentService:   paymentService,
		xenditService:    xenditService,
		anomalyService:   anomalyService,
		paymentPublisher: paymentPublisher,
	}
}

func (u *paymentUsecase) SetWalletUsecase(wu WalletUsecase) {
	u.walletUsecase = wu
}

func (u *paymentUsecase) SavePayment(ctx context.Context, input *model.CreatePaymentInput) error {
	logger.Debug(ctx, "usecase:payment", "Preparing to save new payment record", logrus.Fields{
		"transaction_id":   input.TransactionID,
		"transaction_type": input.TransactionType,
	})

	record := &model.Payment{
		UserID:             input.UserID,
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

func (u *paymentUsecase) GetStalePendingPayments(ctx context.Context) ([]model.Payment, error) {
	logger.Debug(ctx, "usecase:payment", "Fetching stale pending payments", nil)

	records, err := u.paymentService.GetStalePendingPayments(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to fetch stale pending payments", err, nil)
		return nil, err
	}

	return records, nil
}

func (u *paymentUsecase) GetExpiredPendingPayments(ctx context.Context) ([]model.Payment, error) {
	logger.Debug(ctx, "usecase:payment", "Fetching expired pending payments", nil)

	records, err := u.paymentService.GetExpiredPendingPayments(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to fetch expired pending payments", err, nil)
		return nil, err
	}

	return records, nil
}

func (u *paymentUsecase) ExpireOldPayments(ctx context.Context) error {
	logger.Info(ctx, "usecase:expiry", "Starting Expiry Guard job", nil)

	expiredPayments, err := u.GetExpiredPendingPayments(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:expiry", "Failed to fetch expired pending payments", err, nil)
		return err
	}

	if len(expiredPayments) == 0 {
		logger.Info(ctx, "usecase:expiry", "No expired pending payments found, skipping", nil)
		return nil
	}

	logger.Info(ctx, "usecase:expiry", "Found expired pending payments to process", logrus.Fields{
		"count": len(expiredPayments),
	})

	for _, payment := range expiredPayments {
		err := u.paymentService.UpdatePaymentStatus(ctx, payment.TransactionID, "EXPIRED")
		if err != nil {
			logger.Error(ctx, "usecase:expiry", "Failed to expire payment", err, logrus.Fields{
				"transaction_id": payment.TransactionID,
			})
			continue
		}

		logger.Info(ctx, "usecase:expiry", "Payment marked as EXPIRED by Expiry Guard", logrus.Fields{
			"transaction_id":   payment.TransactionID,
			"transaction_type": payment.TransactionType,
			"expires_at":       payment.ExpiresAt.Format("2006-01-02 15:04:05"),
		})

		// Publish payment.expired event for ORDER type
		if payment.TransactionType == model.TRANSACTION_TYPE_ORDER {
			invoiceID := strings.TrimPrefix(payment.TransactionID, model.TRANSACTION_TYPE_ORDER+"-")

			event := model.PaymentEvent{
				Event:     "payment.expired",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				Data: model.PaymentEventData{
					TransactionID: payment.TransactionID,
					InvoiceID:     invoiceID,
					UserID:        payment.UserID,
					Amount:        payment.Amount,
					Status:        "EXPIRED",
				},
			}

			err := u.paymentPublisher.Publish(ctx, invoiceID, event)
			if err != nil {
				logger.Error(ctx, "usecase:expiry", "Failed to publish payment.expired event", err, logrus.Fields{
					"transaction_id": payment.TransactionID,
					"invoice_id":     invoiceID,
				})
			} else {
				logger.Info(ctx, "usecase:expiry", "Successfully published payment.expired event", logrus.Fields{
					"transaction_id": payment.TransactionID,
					"invoice_id":     invoiceID,
				})
			}
		}
	}

	logger.Info(ctx, "usecase:expiry", "Expiry Guard job completed", logrus.Fields{
		"processed_count": len(expiredPayments),
	})

	return nil
}

func (u *paymentUsecase) GetSucceededPaymentTotalsByUser(ctx context.Context) ([]model.UserPaymentTotals, error) {
	logger.Debug(ctx, "usecase:payment", "Fetching succeeded payment totals by user", nil)

	totals, err := u.paymentService.GetSucceededPaymentTotalsByUser(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to fetch payment totals", err, nil)
		return nil, err
	}

	return totals, nil
}

func (u *paymentUsecase) CreateOrderPayment(ctx context.Context, event model.InvoiceCreatedEventData) error {
	logger.Info(ctx, "usecase:payment", "Initiating order payment request from invoice event", logrus.Fields{
		"invoice_id":     event.InvoiceID,
		"user_id":        event.UserID,
		"total_amount":   event.TotalAmount,
		"payment_method": event.PaymentMethod,
		"bank_code":      event.BankCode,
	})

	switch event.PaymentMethod {
	case model.PAYMENT_METHOD_WALLET:
		return u.CreateWalletPayment(ctx, event)
	case model.PAYMENT_METHOD_VA:
		return u.CreateVAPayment(ctx, event)
	default:
		logger.Error(ctx, "usecase:payment", "Unknown payment method in invoice event", fmt.Errorf("unsupported payment method: %s", event.PaymentMethod), logrus.Fields{
			"invoice_id":     event.InvoiceID,
			"payment_method": event.PaymentMethod,
		})
		return fmt.Errorf("unsupported payment method: %s", event.PaymentMethod)
	}
}

func (u *paymentUsecase) CreateVAPayment(ctx context.Context, event model.InvoiceCreatedEventData) error {
	transactionID := fmt.Sprintf("%s-%s", model.TRANSACTION_TYPE_ORDER, event.InvoiceID)

	logger.Info(ctx, "usecase:payment", "Creating VA payment for order", logrus.Fields{
		"invoice_id":     event.InvoiceID,
		"transaction_id": transactionID,
		"bank_code":      event.BankCode,
	})

	// 1. Create Payment Request ke Xendit
	gatewayResp, err := u.xenditService.GenerateVABill(
		ctx,
		event.UserID,
		transactionID,
		transactionID, // idempotency key
		event.TotalAmount,
		event.BankCode,
		event.CustomerName,
	)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to create Xendit payment request for order", err, logrus.Fields{
			"transaction_id": transactionID,
			"invoice_id":     event.InvoiceID,
		})
		return fmt.Errorf("failed to create xendit payment for invoice %s: %w", event.InvoiceID, err)
	}

	// 2. Simpan Payment Record ke DB
	input := &model.CreatePaymentInput{
		UserID:             event.UserID,
		TransactionID:      transactionID,
		TransactionType:    model.TRANSACTION_TYPE_ORDER,
		XenditPaymentReqID: gatewayResp.PaymentID,
		Amount:             gatewayResp.FinalAmount,
		MethodType:         model.PAYMENT_METHOD_VA,
		ChannelCode:        gatewayResp.BankCode,
		PaymentActionInfo:  gatewayResp.VANumber,
		ExpiresAt:          gatewayResp.ExpiresAt,
	}

	err = u.SavePayment(ctx, input)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to save order payment record", err, logrus.Fields{
			"transaction_id": transactionID,
			"invoice_id":     event.InvoiceID,
		})
		return fmt.Errorf("failed to save payment record for invoice %s: %w", event.InvoiceID, err)
	}

	logger.Info(ctx, "usecase:payment", "Successfully created VA order payment", logrus.Fields{
		"transaction_id": transactionID,
		"invoice_id":     event.InvoiceID,
		"va_number":      gatewayResp.VANumber,
		"final_amount":   gatewayResp.FinalAmount,
	})

	return nil
}

func (u *paymentUsecase) CreateWalletPayment(ctx context.Context, event model.InvoiceCreatedEventData) error {
	transactionID := fmt.Sprintf("%s-%s", model.TRANSACTION_TYPE_ORDER, event.InvoiceID)

	logger.Info(ctx, "usecase:payment", "Creating WALLET payment for order", logrus.Fields{
		"invoice_id":     event.InvoiceID,
		"transaction_id": transactionID,
		"user_id":        event.UserID,
		"total_amount":   event.TotalAmount,
	})

	// 1. Hold balance in escrow (Available → Pending)
	err := u.walletUsecase.HoldBalance(ctx, event.UserID, event.TotalAmount)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to hold wallet balance for order payment", err, logrus.Fields{
			"transaction_id": transactionID,
			"invoice_id":     event.InvoiceID,
			"user_id":        event.UserID,
			"amount":         event.TotalAmount,
		})

		// Record anomaly for wallet hold failure
		u.anomalyService.RecordAnomaly(ctx, model.ANOMALY_WALLET_DEDUCT_FAILED, model.SEVERITY_CRITICAL, "WALLET_PAYMENT",
			transactionID, event.UserID, fmt.Sprintf("Failed to hold wallet balance: %s", err.Error()),
			map[string]interface{}{
				"invoice_id": event.InvoiceID,
				"amount":     event.TotalAmount,
				"error":      err.Error(),
			})

		return fmt.Errorf("failed to hold wallet balance for invoice %s: %w", event.InvoiceID, err)
	}

	// 2. Save payment record as SUCCEEDED (wallet payment is immediate)
	now := time.Now()
	record := &model.Payment{
		UserID:             event.UserID,
		TransactionID:      transactionID,
		TransactionType:    model.TRANSACTION_TYPE_ORDER,
		XenditPaymentReqID: fmt.Sprintf("WALLET-%s", transactionID),
		Amount:             event.TotalAmount,
		Currency:           "IDR",
		MethodType:         model.PAYMENT_METHOD_WALLET,
		ChannelCode:        "WALLET",
		PaymentActionInfo:  "Wallet Direct Payment",
		Status:             "SUCCEEDED",
		ExpiresAt:          now,
		PaidAt:             &now,
	}

	err = u.paymentService.SavePaymentRecord(ctx, record)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to save wallet payment record", err, logrus.Fields{
			"transaction_id": transactionID,
			"invoice_id":     event.InvoiceID,
		})

		// Record anomaly — balance already deducted but payment record failed to save
		u.anomalyService.RecordAnomaly(ctx, model.ANOMALY_WALLET_DEDUCT_FAILED, model.SEVERITY_CRITICAL, "WALLET_PAYMENT",
			transactionID, event.UserID, fmt.Sprintf("Wallet deducted but payment record save failed: %s", err.Error()),
			map[string]interface{}{
				"invoice_id": event.InvoiceID,
				"amount":     event.TotalAmount,
				"error":      err.Error(),
			})

		return fmt.Errorf("failed to save wallet payment record for invoice %s: %w", event.InvoiceID, err)
	}

	// 3. Publish payment.success event
	invoiceID := strings.TrimPrefix(transactionID, model.TRANSACTION_TYPE_ORDER+"-")
	successEvent := model.PaymentEvent{
		Event:     "payment.success",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data: model.PaymentEventData{
			TransactionID: transactionID,
			InvoiceID:     invoiceID,
			UserID:        event.UserID,
			Amount:        event.TotalAmount,
			Status:        "SUCCEEDED",
		},
	}

	err = u.paymentPublisher.Publish(ctx, invoiceID, successEvent)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to publish payment.success event for wallet payment", err, logrus.Fields{
			"transaction_id": transactionID,
			"invoice_id":     invoiceID,
		})

		// Record anomaly — payment succeeded but event publish failed
		u.anomalyService.RecordAnomaly(ctx, model.ANOMALY_WALLET_DEDUCT_FAILED, model.SEVERITY_WARNING, "WALLET_PAYMENT",
			transactionID, event.UserID, fmt.Sprintf("Wallet payment succeeded but failed to publish event: %s", err.Error()),
			map[string]interface{}{
				"invoice_id": event.InvoiceID,
				"amount":     event.TotalAmount,
				"error":      err.Error(),
			})
	} else {
		logger.Info(ctx, "usecase:payment", "Successfully published payment.success event for wallet payment", logrus.Fields{
			"transaction_id": transactionID,
			"invoice_id":     invoiceID,
		})
	}

	logger.Info(ctx, "usecase:payment", "Successfully created WALLET order payment", logrus.Fields{
		"transaction_id": transactionID,
		"invoice_id":     event.InvoiceID,
		"amount":         event.TotalAmount,
	})

	return nil
}

func (u *paymentUsecase) GetMyPayments(ctx context.Context, userID string) ([]model.Payment, error) {
	logger.Debug(ctx, "usecase:payment", "Fetching all payments for user", logrus.Fields{
		"user_id": userID,
	})

	payments, err := u.paymentService.GetByUserID(ctx, userID)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to fetch payments for user", err, logrus.Fields{
			"user_id": userID,
		})
		return nil, err
	}

	logger.Info(ctx, "usecase:payment", "Successfully fetched user payments", logrus.Fields{
		"user_id": userID,
		"count":   len(payments),
	})

	return payments, nil
}

func (u *paymentUsecase) GetPaymentDetail(ctx context.Context, transactionID string) (*model.Payment, error) {
	logger.Debug(ctx, "usecase:payment", "Fetching payment detail", logrus.Fields{
		"transaction_id": transactionID,
	})

	record, err := u.paymentService.GetPaymentRecord(ctx, transactionID)
	if err != nil {
		logger.Error(ctx, "usecase:payment", "Failed to fetch payment detail", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return nil, err
	}

	return record, nil
}
