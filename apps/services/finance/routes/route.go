package routes

import (
	"finance/middleware"

	"github.com/gin-gonic/gin"

	"finance/cmd/wallet/handlers"
)

func SetupRoutes(router *gin.Engine, authSecret string, walletHandler handlers.WalletHandler, xenditWebhook handlers.WebhookHandler, paymentHandler handlers.PaymentHandler) {

	publicRoutes := router.Group("/v1/api/payments")
	{
		publicRoutes.POST("/webhooks/xendit", xenditWebhook.HandleXenditCallback)
	}

	protectedRoutes := router.Group("/v1/api")

	protectedRoutes.Use(middleware.AuthMiddleware(authSecret))
	{
		protectedRoutes.GET("/wallets", walletHandler.GetMyWallet)
		protectedRoutes.POST("/wallets/topup", walletHandler.TopUpWallet)

		protectedRoutes.GET("/payments", paymentHandler.GetMyPayments)
		protectedRoutes.GET("/payments/:transaction_id", paymentHandler.GetPaymentDetail)
	}
}
