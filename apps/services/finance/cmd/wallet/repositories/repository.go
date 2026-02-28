package repositories

import (
	"context"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"

	"finance/infrastructure/logger"
	"finance/model"
)

type WalletRepository interface {
	InsertWallet(ctx context.Context, userId string) (*model.Wallet, error)
	SelectWalletByUserID(ctx context.Context, userId string) (*model.Wallet, error)
}

type walletRepository struct {
	DB *gorm.DB
}

func NewWalletRepository(db *gorm.DB) WalletRepository {
	return &walletRepository{DB: db}
}

func (w *walletRepository) InsertWallet(ctx context.Context, userId string) (*model.Wallet, error) {
	var wallet model.Wallet
	wallet.UserID = userId

	err := w.DB.WithContext(ctx).Create(&wallet).Error
	if err != nil {

		logger.Error(ctx, "repository:wallet", "Failed to insert wallet to database", err, logrus.Fields{
			"wallet_user_id": userId,
		})
		return nil, err
	}

	return &wallet, nil
}

func (w *walletRepository) SelectWalletByUserID(ctx context.Context, userId string) (*model.Wallet, error) {
	var wallet model.Wallet

	err := w.DB.WithContext(ctx).Where("user_id = ?", userId).First(&wallet).Error

	if err != nil {

		if err == gorm.ErrRecordNotFound {
			logger.Debug(ctx, "repository:wallet", "Wallet record not found for user", logrus.Fields{
				"wallet_user_id": userId,
			})
			return nil, err
		}

		logger.Error(ctx, "repository:wallet", "Failed to select wallet by User ID", err, logrus.Fields{
			"wallet_user_id": userId,
		})
		return nil, err
	}

	return &wallet, nil
}
