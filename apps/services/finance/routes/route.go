package routes

import (
	"finance/cmd/wallet/handlers"
	"finance/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, authSecret string, walletHandler handlers.WalletHandler) {
	router.Use(middleware.AuthMiddleware(authSecret))

	router.GET("/v1/api/wallet", walletHandler.GetMyWallet)

}
