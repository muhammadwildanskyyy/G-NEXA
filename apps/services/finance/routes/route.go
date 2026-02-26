package routes

import (
	"finance/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, authSecret string) {

	router.Use(middleware.RequestLogger())
	router.Use(middleware.AuthMiddleware(authSecret))

}
