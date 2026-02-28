package usecases

import (
	"context"

	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/services"
	"finance/infrastructure/logger"
	"finance/model"
)

type WalletUsecase interface {
	CreateWallet(ctx context.Context, userId string) (*model.Wallet, error)
	GetWalletByUserID(ctx context.Context, userId string) (*model.Wallet, error)
}

type walletUsecase struct {
	walletService services.WalletService
}

func NewWalletUsecase(walletService services.WalletService) WalletUsecase {
	return &walletUsecase{
		walletService: walletService,
	}
}

func (w *walletUsecase) CreateWallet(ctx context.Context, userId string) (*model.Wallet, error) {

	wallet, err := w.walletService.FindWalletByUser(ctx, userId)
	if err == nil && wallet != nil {

		logger.Info(ctx, "usecase:wallet", "Wallet already exists for user, skipping creation", logrus.Fields{
			"wallet_user_id": userId,
		})
		return wallet, nil
	}

	wallet, err = w.walletService.CreateWallet(ctx, userId)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to create new wallet", err, logrus.Fields{
			"wallet_user_id": userId,
		})
		return nil, err
	}

	logger.Info(ctx, "usecase:wallet", "Successfully completed wallet creation flow", logrus.Fields{
		"wallet_user_id": userId,
	})

	return wallet, nil
}

func (w *walletUsecase) GetWalletByUserID(ctx context.Context, userId string) (*model.Wallet, error) {
	logger.Debug(ctx, "usecase:wallet", "Processing wallet data retrieval request", logrus.Fields{
		"target_user_id": userId,
	})

	wallet, err := w.walletService.FindWalletByUser(ctx, userId)
	if err != nil {
		logger.Error(ctx, "usecase:wallet", "Failed to retrieve wallet data", err, logrus.Fields{
			"target_user_id": userId,
		})
		return nil, err
	}

	logger.Info(ctx, "usecase:wallet", "Successfully retrieved user wallet data", nil)
	return wallet, nil
}
