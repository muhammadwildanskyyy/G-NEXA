package repositories

import (
	"context"
	"errors"

	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"finance/infrastructure/logger"
	"finance/model"
)

type WalletRepository interface {
	InsertWallet(ctx context.Context, userId string) (*model.Wallet, error)
	SelectWalletByUserID(ctx context.Context, userId string) (*model.Wallet, error)
	AddBalance(ctx context.Context, userID string, amount float64) error
	DeductBalance(ctx context.Context, userID string, amount float64) error
	GetAllWallets(ctx context.Context) ([]model.Wallet, error)
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
func (w *walletRepository) AddBalance(ctx context.Context, userID string, amount float64) error {
	return w.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet model.Wallet

		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", userID).
			First(&wallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Wallet not found during add balance operation", logrus.Fields{
					"target_user_id": userID,
				})
				return errors.New("wallet not found for the specified user")
			}

			logger.Error(ctx, "repository:wallet", "Failed to lock wallet for update", err, logrus.Fields{
				"target_user_id": userID,
			})
			return err
		}

		amountToAdd := decimal.NewFromFloat(amount)
		wallet.AvailableBalance = wallet.AvailableBalance.Add(amountToAdd)

		if err := tx.Save(&wallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to save updated wallet balance", err, logrus.Fields{
				"target_user_id": userID,
				"target_amount":  amount,
			})
			return err
		}

		logger.Debug(ctx, "repository:wallet", "Successfully added balance to wallet", logrus.Fields{
			"target_user_id": userID,
			"added_amount":   amount,
			"new_balance":    wallet.AvailableBalance.String(),
		})

		return nil
	})
}

func (w *walletRepository) DeductBalance(ctx context.Context, userID string, amount float64) error {
	return w.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet model.Wallet

		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", userID).
			First(&wallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Wallet not found during deduct balance operation", logrus.Fields{
					"target_user_id": userID,
				})
				return errors.New("wallet not found for the specified user")
			}

			logger.Error(ctx, "repository:wallet", "Failed to lock wallet for deduction", err, logrus.Fields{
				"target_user_id": userID,
			})
			return err
		}

		amountToDeduct := decimal.NewFromFloat(amount)

		if wallet.AvailableBalance.LessThan(amountToDeduct) {
			logger.Warn(ctx, "repository:wallet", "Insufficient wallet balance for deduction", logrus.Fields{
				"target_user_id":    userID,
				"available_balance": wallet.AvailableBalance.String(),
				"deduct_amount":     amount,
			})
			return errors.New("insufficient wallet balance")
		}

		wallet.AvailableBalance = wallet.AvailableBalance.Sub(amountToDeduct)

		if err := tx.Save(&wallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to save wallet after balance deduction", err, logrus.Fields{
				"target_user_id": userID,
				"deduct_amount":  amount,
			})
			return err
		}

		logger.Debug(ctx, "repository:wallet", "Successfully deducted balance from wallet", logrus.Fields{
			"target_user_id": userID,
			"deducted_amount": amount,
			"new_balance":     wallet.AvailableBalance.String(),
		})

		return nil
	})
}

func (w *walletRepository) GetAllWallets(ctx context.Context) ([]model.Wallet, error) {
	var wallets []model.Wallet

	err := w.DB.WithContext(ctx).Find(&wallets).Error
	if err != nil {
		logger.Error(ctx, "repository:wallet", "Failed to fetch all wallets", err, nil)
		return nil, err
	}

	logger.Debug(ctx, "repository:wallet", "Fetched all wallets", logrus.Fields{
		"count": len(wallets),
	})

	return wallets, nil
}
