package routes

import (
	"product-service/cmd/product/handlers"
	"product-service/constant"
	"product-service/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, productHandler handlers.ProductHandler, categoryHandler handlers.CategoryHandler, authSecret string) {

	api := router.Group("/v1/api/products")
	{
		// PUBLIC ROUTES
		api.GET("", productHandler.GetProductInfo)
		api.GET("/categories", categoryHandler.GetAllCategory)

		// PROTECTED ROUTES
		protected := api.Group("", middleware.AuthMiddleware(authSecret))
		{
			// product
			protected.POST("", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.CreateProduct)
			protected.POST("/batch", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.CreateProductBulk)
			protected.GET("/:product_id", productHandler.GetProductByID)
			protected.DELETE("/:product_id", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.DeleteProduct)
			protected.PUT("/:product_id", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.UpdateProduct)
			protected.GET("/by-category/:category_id", productHandler.GetAllProductsByCategoryId)

			// category
			protected.POST("/categories", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.CreateCategory)
			protected.GET("/categories/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN, constant.USER_ROLE.BUYER, constant.USER_ROLE.SELLER}), categoryHandler.GetCategoryById)
			protected.DELETE("/categories/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.Deletecategory)
			protected.PUT("/categories/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.Updatecategory)
		}
	}
}
