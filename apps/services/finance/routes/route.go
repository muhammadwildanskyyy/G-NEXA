package routes

import (
	"finance/middleware"

	"github.com/gin-gonic/gin"

	"finance/cmd/wallet/handlers"
)

func SetupRoutes(router *gin.Engine, authSecret string, walletHandler handlers.WalletHandler, xenditWebhook handlers.WebhookHandler) {

	publicRoutes := router.Group("/v1/api")
	{

		publicRoutes.POST("/webhooks/xendit", xenditWebhook.HandleXenditCallback)
	}

	protectedRoutes := router.Group("/v1/api")

	protectedRoutes.Use(middleware.AuthMiddleware(authSecret))
	{

		protectedRoutes.GET("/wallet", walletHandler.GetMyWallet)
		protectedRoutes.POST("/wallet/topup", walletHandler.TopUpWallet)
	}
}
