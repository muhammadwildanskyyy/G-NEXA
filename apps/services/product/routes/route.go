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
		// product
		api.POST("", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.CreateProduct)
		api.POST("/batch", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.CreateProductBulk)
		api.GET("", productHandler.GetProductInfo)
		api.GET("/:product_id", productHandler.GetProductByID)
		api.DELETE("/:product_id", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.DeleteProduct)
		api.PUT("/:product_id", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.UpdateProduct)
		api.GET("/by-category/:category_id", productHandler.GetAllProductsByCategoryId)

		// category
		api.POST("/categories", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.CreateCategory)
		api.GET("/categories", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN, constant.USER_ROLE.BUYER, constant.USER_ROLE.SELLER}), categoryHandler.GetAllCategory)
		api.GET("/categories/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN, constant.USER_ROLE.BUYER, constant.USER_ROLE.SELLER}), categoryHandler.GetCategoryById)
		api.DELETE("/categories/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.Deletecategory)
		api.PUT("/categories/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.Updatecategory)
	}
}
