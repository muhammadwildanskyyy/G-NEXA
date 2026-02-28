package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/usecases"
	"finance/infrastructure/logger" // Alias to GNEXA Logger
	"finance/utils"
)

type WalletHandler interface {
	GetMyWallet(c *gin.Context)
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
