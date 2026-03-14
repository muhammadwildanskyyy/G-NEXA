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
	HoldBalance(ctx context.Context, userID string, amount float64) error
	AddPendingBalance(ctx context.Context, userID string, amount float64) error
	ReleasePendingToSeller(ctx context.Context, buyerUserID string, sellerUserID string, amount float64) error
	RefundPendingToAvailable(ctx context.Context, userID string, amount float64) error
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

// HoldBalance atomically moves funds from AvailableBalance to PendingBalance (buyer checkout with wallet)
func (w *walletRepository) HoldBalance(ctx context.Context, userID string, amount float64) error {
	return w.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet model.Wallet

		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", userID).
			First(&wallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Wallet not found during hold balance operation", logrus.Fields{
					"target_user_id": userID,
				})
				return errors.New("wallet not found for the specified user")
			}

			logger.Error(ctx, "repository:wallet", "Failed to lock wallet for hold balance", err, logrus.Fields{
				"target_user_id": userID,
			})
			return err
		}

		amountToHold := decimal.NewFromFloat(amount)

		if wallet.AvailableBalance.LessThan(amountToHold) {
			logger.Warn(ctx, "repository:wallet", "Insufficient available balance for hold", logrus.Fields{
				"target_user_id":    userID,
				"available_balance": wallet.AvailableBalance.String(),
				"hold_amount":       amount,
			})
			return errors.New("insufficient wallet balance")
		}

		wallet.AvailableBalance = wallet.AvailableBalance.Sub(amountToHold)
		wallet.PendingBalance = wallet.PendingBalance.Add(amountToHold)

		if err := tx.Save(&wallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to save wallet after hold balance", err, logrus.Fields{
				"target_user_id": userID,
				"hold_amount":    amount,
			})
			return err
		}

		logger.Debug(ctx, "repository:wallet", "Successfully held balance (Available → Pending)", logrus.Fields{
			"target_user_id":        userID,
			"hold_amount":           amount,
			"new_available_balance": wallet.AvailableBalance.String(),
			"new_pending_balance":   wallet.PendingBalance.String(),
		})

		return nil
	})
}

// AddPendingBalance adds funds directly to PendingBalance (VA ORDER payment received — money has a destination)
func (w *walletRepository) AddPendingBalance(ctx context.Context, userID string, amount float64) error {
	return w.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet model.Wallet

		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", userID).
			First(&wallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Wallet not found during add pending balance operation", logrus.Fields{
					"target_user_id": userID,
				})
				return errors.New("wallet not found for the specified user")
			}

			logger.Error(ctx, "repository:wallet", "Failed to lock wallet for add pending balance", err, logrus.Fields{
				"target_user_id": userID,
			})
			return err
		}

		amountToAdd := decimal.NewFromFloat(amount)
		wallet.PendingBalance = wallet.PendingBalance.Add(amountToAdd)

		if err := tx.Save(&wallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to save wallet after add pending balance", err, logrus.Fields{
				"target_user_id": userID,
				"amount":         amount,
			})
			return err
		}

		logger.Debug(ctx, "repository:wallet", "Successfully added pending balance", logrus.Fields{
			"target_user_id":      userID,
			"added_amount":        amount,
			"new_pending_balance": wallet.PendingBalance.String(),
		})

		return nil
	})
}

// ReleasePendingToSeller deducts from buyer's PendingBalance and adds to seller's AvailableBalance (order completed)
func (w *walletRepository) ReleasePendingToSeller(ctx context.Context, buyerUserID string, sellerUserID string, amount float64) error {
	return w.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Lock and deduct buyer's PendingBalance
		var buyerWallet model.Wallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", buyerUserID).
			First(&buyerWallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Buyer wallet not found during release to seller", logrus.Fields{
					"buyer_user_id": buyerUserID,
				})
				return errors.New("buyer wallet not found")
			}
			return err
		}

		amountToRelease := decimal.NewFromFloat(amount)

		if buyerWallet.PendingBalance.LessThan(amountToRelease) {
			logger.Warn(ctx, "repository:wallet", "Insufficient pending balance for release to seller", logrus.Fields{
				"buyer_user_id":   buyerUserID,
				"pending_balance": buyerWallet.PendingBalance.String(),
				"release_amount":  amount,
			})
			return errors.New("insufficient pending balance for release")
		}

		buyerWallet.PendingBalance = buyerWallet.PendingBalance.Sub(amountToRelease)

		if err := tx.Save(&buyerWallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to deduct buyer pending balance", err, logrus.Fields{
				"buyer_user_id": buyerUserID,
			})
			return err
		}

		// 2. Lock and add to seller's AvailableBalance
		var sellerWallet model.Wallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", sellerUserID).
			First(&sellerWallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Seller wallet not found during release to seller", logrus.Fields{
					"seller_user_id": sellerUserID,
				})
				return errors.New("seller wallet not found")
			}
			return err
		}

		sellerWallet.AvailableBalance = sellerWallet.AvailableBalance.Add(amountToRelease)

		if err := tx.Save(&sellerWallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to add seller available balance", err, logrus.Fields{
				"seller_user_id": sellerUserID,
			})
			return err
		}

		logger.Debug(ctx, "repository:wallet", "Successfully released pending balance to seller", logrus.Fields{
			"buyer_user_id":              buyerUserID,
			"seller_user_id":             sellerUserID,
			"release_amount":             amount,
			"buyer_new_pending_balance":  buyerWallet.PendingBalance.String(),
			"seller_new_available_balance": sellerWallet.AvailableBalance.String(),
		})

		return nil
	})
}

// RefundPendingToAvailable moves funds from PendingBalance back to AvailableBalance (order cancelled/refund)
func (w *walletRepository) RefundPendingToAvailable(ctx context.Context, userID string, amount float64) error {
	return w.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet model.Wallet

		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", userID).
			First(&wallet).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Warn(ctx, "repository:wallet", "Wallet not found during refund pending to available", logrus.Fields{
					"target_user_id": userID,
				})
				return errors.New("wallet not found for the specified user")
			}

			logger.Error(ctx, "repository:wallet", "Failed to lock wallet for refund", err, logrus.Fields{
				"target_user_id": userID,
			})
			return err
		}

		amountToRefund := decimal.NewFromFloat(amount)

		if wallet.PendingBalance.LessThan(amountToRefund) {
			logger.Warn(ctx, "repository:wallet", "Insufficient pending balance for refund", logrus.Fields{
				"target_user_id":  userID,
				"pending_balance": wallet.PendingBalance.String(),
				"refund_amount":   amount,
			})
			return errors.New("insufficient pending balance for refund")
		}

		wallet.PendingBalance = wallet.PendingBalance.Sub(amountToRefund)
		wallet.AvailableBalance = wallet.AvailableBalance.Add(amountToRefund)

		if err := tx.Save(&wallet).Error; err != nil {
			logger.Error(ctx, "repository:wallet", "Failed to save wallet after refund", err, logrus.Fields{
				"target_user_id": userID,
				"refund_amount":  amount,
			})
			return err
		}

		logger.Debug(ctx, "repository:wallet", "Successfully refunded pending balance to available (Pending → Available)", logrus.Fields{
			"target_user_id":        userID,
			"refund_amount":         amount,
			"new_available_balance": wallet.AvailableBalance.String(),
			"new_pending_balance":   wallet.PendingBalance.String(),
		})

		return nil
	})
}
