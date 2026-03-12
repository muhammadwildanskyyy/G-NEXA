package usecases

import (
	"context"
	"fmt"
	"time"

	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/services"
	"finance/infrastructure/logger"
	"finance/model"
)

type WalletUsecase interface {
	CreateWallet(ctx context.Context, userID string) (*model.Wallet, error)
	GetWalletByUserID(ctx context.Context, userID string) (*model.Wallet, error)
	TopUpWallet(ctx context.Context, userID string, amount float64, bankCode string, customerName string) (*model.PaymentResponse, error)
	AddBalance(ctx context.Context, userID string, amount float64, bankCode string) error
	DeductBalance(ctx context.Context, userID string, amount float64) error
	SetXenditUsecase(xu XenditUsecase)
	ReconcileBalances(ctx context.Context) error
}

type walletUsecase struct {
	WalletService  services.WalletService
	XenditUsecase  XenditUsecase
	PaymentUsecase PaymentUsecase
	AnomalyService services.AnomalyService
}

func NewWalletUsecase(walletService services.WalletService, xenditUsecase XenditUsecase, paymentUsecase PaymentUsecase, anomalyService services.AnomalyService) WalletUsecase {
	return &walletUsecase{
		WalletService:  walletService,
		XenditUsecase:  xenditUsecase,
		PaymentUsecase: paymentUsecase,
		AnomalyService: anomalyService,
	}
}

func (wu *walletUsecase) SetXenditUsecase(xu XenditUsecase) {
	wu.XenditUsecase = xu
}

func (wu *walletUsecase) CreateWallet(ctx context.Context, userID string) (*model.Wallet, error) {
	wallet, err := wu.WalletService.FindWalletByUser(ctx, userID)
	if err == nil && wallet != nil {
		logger.Info(ctx, "usecase:wallet", "Wallet already exists for user, skipping creation", logrus.Fields{
			"target_user_id": userID,
		})
		return wallet, nil
	}

	wallet, err = wu.WalletService.CreateWallet(ctx, userID)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to create new wallet", err, logrus.Fields{
			"target_user_id": userID,
		})
		return nil, err
	}

	logger.Info(ctx, "usecase:wallet", "Successfully completed wallet creation flow", logrus.Fields{
		"target_user_id": userID,
	})

	return wallet, nil
}

func (wu *walletUsecase) GetWalletByUserID(ctx context.Context, userID string) (*model.Wallet, error) {
	logger.Debug(ctx, "usecase:wallet", "Processing wallet data retrieval request", logrus.Fields{
		"target_user_id": userID,
	})

	wallet, err := wu.WalletService.FindWalletByUser(ctx, userID)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to retrieve wallet data", err, logrus.Fields{
			"target_user_id": userID,
		})
		return nil, err
	}

	logger.Info(ctx, "usecase:wallet", "Successfully retrieved user wallet data", nil)
	return wallet, nil
}

func (wu *walletUsecase) TopUpWallet(ctx context.Context, userID string, amount float64, bankCode string, customerName string) (*model.PaymentResponse, error) {
	transactionID := fmt.Sprintf("%s-%s-%d", model.TRANSACTION_TYPE_TOPUP, userID, time.Now().Unix())

	logger.Debug(ctx, "usecase:wallet", "Initiating top-up payment request", logrus.Fields{
		"target_user_id": userID,
		"transaction_id": transactionID,
		"bank_code":      bankCode,
		"amount":         amount,
	})

	response, err := wu.XenditUsecase.CreatePaymentRequest(ctx, userID, transactionID, amount, bankCode, customerName)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to create payment request via Xendit", err, logrus.Fields{
			"target_user_id": userID,
			"transaction_id": transactionID,
		})
		return nil, err
	}

	inputPayment := &model.CreatePaymentInput{
		UserID:             userID,
		TransactionID:      transactionID,
		TransactionType:    model.TRANSACTION_TYPE_TOPUP,
		XenditPaymentReqID: response.PaymentID,
		Amount:             response.FinalAmount,
		MethodType:         model.PAYMENT_METHOD_VA,
		ChannelCode:        response.BankCode,
		PaymentActionInfo:  response.VANumber,
		ExpiresAt:          response.ExpiresAt,
	}

	err = wu.PaymentUsecase.SavePayment(ctx, inputPayment)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to save payment record to database", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		return nil, err
	}

	logger.Info(ctx, "usecase:wallet", "Successfully processed top-up initiation", logrus.Fields{
		"transaction_id": transactionID,
		"va_number":      response.VANumber,
	})

	return response, nil
}

func (wu *walletUsecase) AddBalance(ctx context.Context, userID string, amount float64, bankCode string) error {
	logger.Debug(ctx, "usecase:wallet", "Delegating add balance operation to wallet service", logrus.Fields{
		"target_user_id": userID,
		"amount":         amount,
		"bank_code":      bankCode,
	})

	err := wu.WalletService.AddBalance(ctx, userID, amount, bankCode)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to add balance via wallet service", err, logrus.Fields{
			"target_user_id": userID,
		})
		return err
	}

	return nil
}

func (wu *walletUsecase) DeductBalance(ctx context.Context, userID string, amount float64) error {
	logger.Debug(ctx, "usecase:wallet", "Delegating deduct balance operation to wallet service", logrus.Fields{
		"target_user_id": userID,
		"amount":         amount,
	})

	err := wu.WalletService.DeductBalance(ctx, userID, amount)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to deduct balance via wallet service", err, logrus.Fields{
			"target_user_id": userID,
		})
		return err
	}

	return nil
}

func (wu *walletUsecase) ReconcileBalances(ctx context.Context) error {
	logger.Info(ctx, "usecase:reconciliation", "Starting Balance Reconciliation audit", nil)

	// 1. Ambil semua wallet
	wallets, err := wu.WalletService.GetAllWallets(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:reconciliation", "Failed to fetch wallets for reconciliation", err, nil)
		return err
	}

	if len(wallets) == 0 {
		logger.Info(ctx, "usecase:reconciliation", "No wallets found, skipping reconciliation", nil)
		return nil
	}

	// 2. Ambil total payment SUCCEEDED per user
	paymentTotals, err := wu.PaymentUsecase.GetSucceededPaymentTotalsByUser(ctx)
	if err != nil {
		logger.Error(ctx, "usecase:reconciliation", "Failed to fetch payment totals for reconciliation", err, nil)
		return err
	}

	// 3. Buat map user_id -> totals untuk lookup cepat
	totalsMap := make(map[string]model.UserPaymentTotals)
	for _, t := range paymentTotals {
		totalsMap[t.UserID] = t
	}

	// 4. Bandingkan expected vs actual balance
	mismatchCount := 0
	for _, wallet := range wallets {
		totals, exists := totalsMap[wallet.UserID]

		var expectedBalance decimal.Decimal
		if exists {
			topUp := decimal.NewFromFloat(totals.TotalTopUp)
			order := decimal.NewFromFloat(totals.TotalOrder)
			expectedBalance = topUp.Sub(order)
		} else {
			// Tidak ada transaksi sukses, expected = 0
			expectedBalance = decimal.NewFromFloat(0)
		}

		actualBalance := wallet.AvailableBalance
		difference := actualBalance.Sub(expectedBalance)

		if !difference.IsZero() {
			mismatchCount++
			logger.Error(ctx, "usecase:reconciliation",
				"⚠️ BALANCE MISMATCH DETECTED — Requires manual investigation",
				fmt.Errorf("balance mismatch for user %s: expected %s, actual %s, diff %s",
					wallet.UserID, expectedBalance.String(), actualBalance.String(), difference.String()),
				logrus.Fields{
					"user_id":          wallet.UserID,
					"expected_balance": expectedBalance.String(),
					"actual_balance":   actualBalance.String(),
					"difference":       difference.String(),
					"total_topup":      totals.TotalTopUp,
					"total_order":      totals.TotalOrder,
				},
			)

			// Anomaly #5: BALANCE_MISMATCH
			wu.AnomalyService.RecordAnomaly(ctx, model.ANOMALY_BALANCE_MISMATCH, model.SEVERITY_CRITICAL, "RECONCILIATION",
				"", wallet.UserID, fmt.Sprintf("Balance mismatch: expected %s, actual %s, diff %s",
					expectedBalance.String(), actualBalance.String(), difference.String()),
				map[string]interface{}{
					"expected_balance": expectedBalance.String(),
					"actual_balance":   actualBalance.String(),
					"difference":       difference.String(),
					"total_topup":      totals.TotalTopUp,
					"total_order":      totals.TotalOrder,
				})
		}
	}

	if mismatchCount == 0 {
		logger.Info(ctx, "usecase:reconciliation", "✅ Balance Reconciliation completed — all balances match", logrus.Fields{
			"wallets_checked": len(wallets),
		})
	} else {
		logger.Error(ctx, "usecase:reconciliation",
			"🚨 Balance Reconciliation completed with MISMATCHES",
			fmt.Errorf("%d balance mismatches detected out of %d wallets", mismatchCount, len(wallets)),
			logrus.Fields{
				"wallets_checked": len(wallets),
				"mismatch_count":  mismatchCount,
			},
		)
	}

	return nil
}
