package usecases

import (
	"context"
	"fmt"
	"time"

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
	SetXenditUsecase(xu XenditUsecase)
}

type walletUsecase struct {
	WalletService  services.WalletService
	XenditUsecase  XenditUsecase
	PaymentUsecase PaymentUsecase
}

func NewWalletUsecase(walletService services.WalletService, xenditUsecase XenditUsecase, paymentUsecase PaymentUsecase) WalletUsecase {
	return &walletUsecase{
		WalletService:  walletService,
		XenditUsecase:  xenditUsecase,
		PaymentUsecase: paymentUsecase,
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
