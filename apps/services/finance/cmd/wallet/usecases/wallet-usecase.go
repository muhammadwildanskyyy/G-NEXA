package usecases

import (
	"context"
	"finance/cmd/wallet/services"
	"finance/infrastructure/logger"
	"finance/model"

	"github.com/sirupsen/logrus"
)

type WalletUsecase interface {
	CreateWallet(ctx context.Context, userId string) (*model.Wallet, error)
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
	logFields := logrus.Fields{
		"layer":   "Usecase",
		"func":    "CreateWallet()",
		"user_id": userId,
	}
	wallet, err := w.walletService.FindWalletByUser(ctx, userId)
	if err == nil {
		logger.LogError(logFields, "Failed Create Wallet user already have wallet", "w.walletService.FindWalletByUser()", err)
		return wallet, nil
	}

	wallet, err = w.walletService.CreateWallet(ctx, userId)
	if err != nil {
		logger.LogError(logFields, "Failed Create Wallet user", "walletService.CreateWallet()", err)
		return nil, err
	}
	return wallet, nil
}
