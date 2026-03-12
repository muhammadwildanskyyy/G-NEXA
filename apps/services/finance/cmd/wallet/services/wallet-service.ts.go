package services

import (
	"context"
	"errors"
	"finance/constant"

	"github.com/sirupsen/logrus"
	"github.com/xendit/xendit-go/v7/payment_request"

	"finance/cmd/wallet/repositories"
	"finance/infrastructure/logger"
	"finance/model"
)

type WalletService interface {
	CreateWallet(ctx context.Context, userId string) (*model.Wallet, error)
	FindWalletByUser(ctx context.Context, userId string) (*model.Wallet, error)
	AddBalance(ctx context.Context, userID string, amount float64, bankCode string) error
	DeductBalance(ctx context.Context, userID string, amount float64) error
	GetAllWallets(ctx context.Context) ([]model.Wallet, error)
}

type walletService struct {
	WalletRepository repositories.WalletRepository
}

func NewWalletService(walletRepository repositories.WalletRepository) WalletService {
	return &walletService{WalletRepository: walletRepository}
}

func (ws *walletService) CreateWallet(ctx context.Context, userId string) (*model.Wallet, error) {

	logger.Debug(ctx, "service:wallet", "Attempting to create a new wallet for user", logrus.Fields{
		"target_user_id": userId,
	})

	newWallet, err := ws.WalletRepository.InsertWallet(ctx, userId)
	if err != nil {
		logger.Error(ctx, "service:wallet", "Failed to create wallet via repository", err, logrus.Fields{
			"target_user_id": userId,
		})
		return nil, err
	}

	logger.Info(ctx, "service:wallet", "Successfully created new wallet", logrus.Fields{
		"wallet_id": newWallet.ID,
	})
	return newWallet, nil
}

func (ws *walletService) FindWalletByUser(ctx context.Context, userId string) (*model.Wallet, error) {
	logger.Debug(ctx, "service:wallet", "Fetching wallet for user", logrus.Fields{
		"target_user_id": userId,
	})

	wallet, err := ws.WalletRepository.SelectWalletByUserID(ctx, userId)
	if err != nil {

		logger.Error(ctx, "service:wallet", "Failed to find wallet via repository", err, logrus.Fields{
			"target_user_id": userId,
		})
		return nil, err
	}

	return wallet, nil
}

func (ws *walletService) AddBalance(ctx context.Context, userID string, amount float64, bankCode string) error {
	switch bankCode {
	case string(payment_request.VIRTUALACCOUNTCHANNELCODE_BCA):
		amount -= constant.BCA_ADMIN_FEE
	case string(payment_request.VIRTUALACCOUNTCHANNELCODE_MANDIRI):
		amount -= constant.MANDIRI_ADMIN_FEE
	case string(payment_request.VIRTUALACCOUNTCHANNELCODE_BRI):
		amount -= constant.BRI_ADMIN_FEE
	}

	if userID == "" {
		logger.Warn(ctx, "service:wallet", "Attempted to add balance with empty user ID", nil)
		return errors.New("user ID cannot be empty")
	}

	if amount <= 0 {
		logger.Warn(ctx, "service:wallet", "Invalid top-up amount after admin fee deduction", logrus.Fields{
			"target_user_id": userID,
			"bank_code":      bankCode,
			"final_amount":   amount,
		})
		return errors.New("top-up amount must be greater than zero after fee deduction")
	}

	err := ws.WalletRepository.AddBalance(ctx, userID, amount)
	if err != nil {
		return err
	}

	logger.Info(ctx, "service:wallet", "Successfully processed add balance request", logrus.Fields{
		"target_user_id": userID,
		"bank_code":      bankCode,
		"final_amount":   amount,
	})

	return nil
}

func (ws *walletService) GetAllWallets(ctx context.Context) ([]model.Wallet, error) {
	logger.Debug(ctx, "service:wallet", "Fetching all wallets", nil)

	wallets, err := ws.WalletRepository.GetAllWallets(ctx)
	if err != nil {
		logger.Error(ctx, "service:wallet", "Failed to fetch all wallets", err, nil)
		return nil, err
	}

	return wallets, nil
}

func (ws *walletService) DeductBalance(ctx context.Context, userID string, amount float64) error {
	if userID == "" {
		logger.Warn(ctx, "service:wallet", "Attempted to deduct balance with empty user ID", nil)
		return errors.New("user ID cannot be empty")
	}

	if amount <= 0 {
		logger.Warn(ctx, "service:wallet", "Invalid deduction amount", logrus.Fields{
			"target_user_id": userID,
			"amount":         amount,
		})
		return errors.New("deduction amount must be greater than zero")
	}

	err := ws.WalletRepository.DeductBalance(ctx, userID, amount)
	if err != nil {
		logger.Error(ctx, "service:wallet", "Failed to deduct balance via repository", err, logrus.Fields{
			"target_user_id": userID,
			"amount":         amount,
		})
		return err
	}

	logger.Info(ctx, "service:wallet", "Successfully deducted balance from wallet", logrus.Fields{
		"target_user_id": userID,
		"amount":         amount,
	})

	return nil
}

