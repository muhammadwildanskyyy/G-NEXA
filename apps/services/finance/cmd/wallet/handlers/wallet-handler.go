package handlers

import (
	"finance/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/usecases"
	"finance/infrastructure/logger" // Alias to GNEXA Logger
	"finance/utils"
)

type WalletHandler interface {
	GetMyWallet(c *gin.Context)
	TopUpWallet(c *gin.Context)
}

type walletHandler struct {
	walletUsecase usecases.WalletUsecase
}

func NewWalletHandler(walletUsecase usecases.WalletUsecase) WalletHandler {
	return &walletHandler{
		walletUsecase: walletUsecase,
	}
}

func (h *walletHandler) GetMyWallet(c *gin.Context) {

	ctx := c.Request.Context()

	userIDVal, exists := c.Get("user_id")
	if !exists {

		logger.Warn(ctx, "handler:wallet", "Access denied: user_id not found in Gin context", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Unauthorized access")
		return
	}

	userID, ok := userIDVal.(string)
	if !ok || userID == "" {
		logger.Warn(ctx, "handler:wallet", "Access denied: invalid user_id format", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Invalid user token data")
		return
	}

	logger.Info(ctx, "handler:wallet", "Received HTTP request to retrieve wallet balance", logrus.Fields{
		"client_ip": c.ClientIP(),
	})

	wallet, err := h.walletUsecase.GetWalletByUserID(ctx, userID)
	if err != nil {

		logger.Error(ctx, "handler:wallet", "Usecase failed to retrieve wallet", err, nil)
		utils.ResponseError(c, http.StatusInternalServerError, "Failed to retrieve wallet balance")
		return
	}

	utils.ResponseSuccess(c, wallet, "Wallet data retrieved successfully", http.StatusOK)
}

func (h *walletHandler) TopUpWallet(c *gin.Context) {
	ctx := c.Request.Context()

	// 1. Extract User ID from Middleware (Same as GetMyWallet)
	userIDVal, exists := c.Get("user_id")
	if !exists {
		logger.Warn(ctx, "handler:wallet", "Access denied: user_id not found in context", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Unauthorized access")
		return
	}

	userID, ok := userIDVal.(string)
	if !ok || userID == "" {
		logger.Warn(ctx, "handler:wallet", "Access denied: invalid user_id format", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Invalid user token data")
		return
	}

	// 2. Parse and Validate JSON Request Body
	var req model.TopUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn(ctx, "handler:wallet", "Failed to bind JSON request body", logrus.Fields{
			"client_ip": c.ClientIP(),
			"error":     err.Error(),
		})
		utils.ResponseError(c, http.StatusBadRequest, "Invalid or incomplete request payload")
		return
	}

	logger.Info(ctx, "handler:wallet", "Received HTTP request to initiate wallet top-up", logrus.Fields{
		"client_ip":      c.ClientIP(),
		"target_user_id": userID,
		"target_amount":  req.Amount,
		"bank_code":      req.BankCode,
	})

	// 3. Pass to Usecase (Execute the Top-Up logic)
	paymentResponse, err := h.walletUsecase.TopUpWallet(ctx, userID, req.Amount, req.BankCode, req.CustomerName)
	if err != nil {
		logger.Error(ctx, "handler:wallet", "Usecase failed to process wallet top-up", err, logrus.Fields{
			"target_user_id": userID,
			"target_amount":  req.Amount,
			"bank_code":      req.BankCode,
		})
		utils.ResponseError(c, http.StatusInternalServerError, "Failed to process top-up request")
		return
	}

	logger.Info(ctx, "handler:wallet", "Successfully initiated top-up request", logrus.Fields{
		"target_user_id": userID,
	})

	// 4. Return Success Response to Frontend (Contains VA Number & Status)
	utils.ResponseSuccess(c, paymentResponse, "Top-up request successfully created", http.StatusOK)
}
