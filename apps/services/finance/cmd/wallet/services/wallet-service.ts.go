package services

import (
	"context"
	"finance/cmd/wallet/repositories"
	"finance/infrastructure/logger"
	"finance/model"

	"github.com/sirupsen/logrus"
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
	logFields := logrus.Fields{
		"layer":   "Service",
		"func":    "CreateWallet()",
		"user_id": userId,
	}
	newWallet, err := w.WalletRepository.InserWallet(ctx, userId)
	if err != nil {
		logger.LogError(logFields, "Failed Create Wallet", "w.WalletRepository.InserWallet()", err)
		return nil, err
	}

	return newWallet, nil
}

func (w *walletService) FindWalletByUser(ctx context.Context, userId string) (*model.Wallet, error) {

	logFields := logrus.Fields{
		"layer":   "Service",
		"func":    "FindWalletByUser()",
		"user_id": userId,
	}
	wallet, err := w.WalletRepository.SelectWalletByUSerId(ctx, userId)
	if err != nil {
		logger.LogError(logFields, "Failed Find Wallet", "w.WalletRepository.SelectWalletByUSerId()", err)
		return nil, err
	}
	return wallet, nil
}
