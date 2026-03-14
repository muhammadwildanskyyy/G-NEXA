package routes

import (
	"product-service/cmd/product/handlers"
	"product-service/constant"
	"product-service/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, productHandler handlers.ProductHandler, categoryHandler handlers.CategoryHandler, authSecret string) {

	router.Use(middleware.TracingMiddleware())
	router.Use(middleware.AuthMiddleware(authSecret))

	// product
	router.POST("/v1/product", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.CreateProduct)
	router.POST("/v1/batch-product", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.CreateProductBulk)
	router.GET("/v1/products", productHandler.GetProductInfo)
	router.GET("/v1/product/:product_id", productHandler.GetProductByID)
	router.DELETE("/v1/product/:product_id", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.DeleteProduct)
	router.PUT("/v1/product/:product_id", middleware.AclMiddleware([]string{constant.USER_ROLE.SELLER, constant.USER_ROLE.ADMIN}), productHandler.UpdateProduct)
	router.GET("/v1/products-by-category/:category_id", productHandler.GetAllProductsByCategoryId)

	// category

	router.POST("/v1/category", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.CreateCategory)
	router.GET("/v1/categories", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN, constant.USER_ROLE.BUYER, constant.USER_ROLE.SELLER}), categoryHandler.GetAllCategory)
	router.GET("/v1/category/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN, constant.USER_ROLE.BUYER, constant.USER_ROLE.SELLER}), categoryHandler.GetCategoryById)
	router.DELETE("/v1/category/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.Deletecategory)
	router.PUT("/v1/category/:category_id", middleware.AclMiddleware([]string{constant.USER_ROLE.ADMIN}), categoryHandler.Updatecategory)

}
