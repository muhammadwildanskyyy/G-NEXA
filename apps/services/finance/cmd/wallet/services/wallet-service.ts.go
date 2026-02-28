package services

import (
	"context"

	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/repositories"
	"finance/infrastructure/logger"
	"finance/model"
)

type WalletService interface {
	CreateWallet(ctx context.Context, userId string) (*model.Wallet, error)
	FindWalletByUser(ctx context.Context, userId string) (*model.Wallet, error)
}

type walletService struct {
	WalletRepository repositories.WalletRepository
}

func NewWalletService(walletRepository repositories.WalletRepository) WalletService {
	return &walletService{WalletRepository: walletRepository}
}

func (w *walletService) CreateWallet(ctx context.Context, userId string) (*model.Wallet, error) {

	logger.Debug(ctx, "service:wallet", "Attempting to create a new wallet for user", logrus.Fields{
		"target_user_id": userId,
	})

	newWallet, err := w.WalletRepository.InsertWallet(ctx, userId)
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

func (w *walletService) FindWalletByUser(ctx context.Context, userId string) (*model.Wallet, error) {
	logger.Debug(ctx, "service:wallet", "Fetching wallet for user", logrus.Fields{
		"target_user_id": userId,
	})

	wallet, err := w.WalletRepository.SelectWalletByUserID(ctx, userId)
	if err != nil {

		logger.Error(ctx, "service:wallet", "Failed to find wallet via repository", err, logrus.Fields{
			"target_user_id": userId,
		})
		return nil, err
	}

	return wallet, nil
}
