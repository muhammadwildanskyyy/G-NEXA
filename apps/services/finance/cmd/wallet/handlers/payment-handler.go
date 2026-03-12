package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/usecases"
	"finance/infrastructure/logger"
	"finance/utils"
)

type PaymentHandler interface {
	GetMyPayments(c *gin.Context)
	GetPaymentDetail(c *gin.Context)
}

type paymentHandler struct {
	paymentUsecase usecases.PaymentUsecase
}

func NewPaymentHandler(paymentUsecase usecases.PaymentUsecase) PaymentHandler {
	return &paymentHandler{
		paymentUsecase: paymentUsecase,
	}
}

func (h *paymentHandler) GetMyPayments(c *gin.Context) {
	ctx := c.Request.Context()

	userIDVal, exists := c.Get("user_id")
	if !exists {
		logger.Warn(ctx, "handler:payment", "Access denied: user_id not found in context", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Unauthorized access")
		return
	}

	userID, ok := userIDVal.(string)
	if !ok || userID == "" {
		logger.Warn(ctx, "handler:payment", "Access denied: invalid user_id format", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Invalid user token data")
		return
	}

	logger.Info(ctx, "handler:payment", "Received HTTP request to retrieve user payments", logrus.Fields{
		"client_ip": c.ClientIP(),
	})

	payments, err := h.paymentUsecase.GetMyPayments(ctx, userID)
	if err != nil {
		logger.Error(ctx, "handler:payment", "Failed to retrieve user payments", err, nil)
		utils.ResponseError(c, http.StatusInternalServerError, "Failed to retrieve payments")
		return
	}

	utils.ResponseSuccess(c, payments, "Payments retrieved successfully", http.StatusOK)
}

func (h *paymentHandler) GetPaymentDetail(c *gin.Context) {
	ctx := c.Request.Context()

	userIDVal, exists := c.Get("user_id")
	if !exists {
		logger.Warn(ctx, "handler:payment", "Access denied: user_id not found in context", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Unauthorized access")
		return
	}

	_, ok := userIDVal.(string)
	if !ok {
		logger.Warn(ctx, "handler:payment", "Access denied: invalid user_id format", nil)
		utils.ResponseError(c, http.StatusUnauthorized, "Invalid user token data")
		return
	}

	transactionID := c.Param("transaction_id")
	if transactionID == "" {
		logger.Warn(ctx, "handler:payment", "Missing transaction_id path parameter", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Transaction ID is required")
		return
	}

	logger.Info(ctx, "handler:payment", "Received HTTP request to retrieve payment detail", logrus.Fields{
		"client_ip":      c.ClientIP(),
		"transaction_id": transactionID,
	})

	payment, err := h.paymentUsecase.GetPaymentDetail(ctx, transactionID)
	if err != nil {
		logger.Error(ctx, "handler:payment", "Failed to retrieve payment detail", err, logrus.Fields{
			"transaction_id": transactionID,
		})
		utils.ResponseError(c, http.StatusNotFound, "Payment not found")
		return
	}

	utils.ResponseSuccess(c, payment, "Payment detail retrieved successfully", http.StatusOK)
}
