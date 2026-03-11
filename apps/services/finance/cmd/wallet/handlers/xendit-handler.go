package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/usecases"
	"finance/infrastructure/logger"
	"finance/model"
	"finance/utils"
)

type WebhookHandler interface {
	HandleXenditCallback(c *gin.Context)
}

type webhookHandler struct {
	xenditUsecase usecases.XenditUsecase
	webhookToken  string
}

func NewWebhookHandler(xenditUsecase usecases.XenditUsecase, webhookToken string) WebhookHandler {
	return &webhookHandler{
		xenditUsecase: xenditUsecase,
		webhookToken:  webhookToken,
	}
}

func (h *webhookHandler) HandleXenditCallback(c *gin.Context) {
	ctx := c.Request.Context()

	expectedToken := h.webhookToken
	incomingToken := c.GetHeader("x-callback-token")

	if incomingToken == "" || incomingToken != expectedToken {
		logger.Warn(ctx, "handler:webhook", "Webhook access denied: Invalid or missing token", logrus.Fields{
			"client_ip": c.ClientIP(),
		})
		utils.ResponseError(c, http.StatusForbidden, "Access denied")
		return
	}

	var payload model.PaymentCallback
	if err := c.ShouldBindJSON(&payload); err != nil {
		logger.Error(ctx, "handler:webhook", "Failed to parse Xendit JSON payload", err, logrus.Fields{
			"client_ip": c.ClientIP(),
		})
		utils.ResponseError(c, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if payload.Data == nil {
		logger.Warn(ctx, "handler:webhook", "Webhook payload is missing the 'data' field", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Transaction data not found in payload")
		return
	}

	logger.Info(ctx, "handler:webhook", "Received Xendit webhook callback", logrus.Fields{
		"event":        payload.Event,
		"status":       payload.Data.Status,
		"reference_id": payload.Data.ReferenceId,
		"amount":       payload.Data.Amount,
	})

	err := h.xenditUsecase.ProcessPaymentCallback(ctx, payload)
	if err != nil {
		logger.Error(ctx, "handler:webhook", "Failed to process webhook logic in Usecase", err, logrus.Fields{
			"reference_id": payload.Data.ReferenceId,
		})

		utils.ResponseError(c, http.StatusInternalServerError, "Failed to process callback")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Callback processed successfully",
	})
}
