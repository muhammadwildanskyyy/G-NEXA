package repositories

import (
	"context"
	"finance/infrastructure/logger"
	"finance/model"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type WalletRepository interface {
	InserWallet(ctx context.Context, userId string) (*model.Wallet, error)
	SelectWalletByUSerId(ctx context.Context, userId string) (*model.Wallet, error)
}
type walletRepository struct {
	DB *gorm.DB
}

func NewWalletrepository(db *gorm.DB) WalletRepository {
	return &walletRepository{DB: db}
}

func (w *walletRepository) InserWallet(ctx context.Context, userId string) (*model.Wallet, error) {
	logFields := logrus.Fields{
		"layer":   "Repository",
		"func":    "InserWallet",
		"user_id": userId,
	}
	var wallet model.Wallet
	wallet.UserID = userId
	err := w.DB.Model(model.Wallet{}).WithContext(ctx).Create(&wallet).Error
	if err != nil {
		logger.LogError(logFields, "Failed Create Wallet", "err := w.DB.Model().WithContext().Create().Error", err)
		return nil, err
	}

	return &wallet, nil

}

func (w *walletRepository) SelectWalletByUSerId(ctx context.Context, userId string) (*model.Wallet, error) {
	logFields := logrus.Fields{
		"layer":   "Repository",
		"func":    "SelectWalletByUSerId",
		"user_id": userId,
	}
	var wallet model.Wallet
	err := w.DB.Model(model.Wallet{}).WithContext(ctx).First(&wallet).Error
	if err != nil {
		logger.LogError(logFields, "Failed Select Wallet Bi User", "w.DB.Model().WithContext().First().Error", err)
		return nil, err
	}
	return &wallet, nil

}
