package routes

import (
	"product-service/cmd/product/handlers"
	"product-service/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, productHandler handlers.ProductHandler, categoryHandler handlers.CategoryHandler, authSecret string) {

	router.Use(middleware.RequestLogger())
	router.Use(middleware.AuthMiddleware(authSecret))

	// product
	router.POST("/v1/product", productHandler.CreateProduct)
	router.GET("/v1/products", productHandler.GetProductInfo)
	router.GET("/v1/product/:product_id", productHandler.GetProductByID)
	router.DELETE("/v1/product/:product_id", productHandler.DeleteProduct)
	router.PUT("/v1/product/:product_id", productHandler.UpdateProduct)
	router.GET("/v1/products-by-category/:category_id", productHandler.GetAllProductsByCategoryId)

	// todo : implementasi guard for admin
	// category

	router.POST("/v1/category", middleware.AclMiddleware([]string{"ADMIN"}), categoryHandler.CreateCategory)
	router.GET("/v1/categories", middleware.AclMiddleware([]string{"ADMIN"}), categoryHandler.GetAllCategory)
	router.GET("/v1/category/:category_id", middleware.AclMiddleware([]string{"ADMIN"}), categoryHandler.GetCategoryById)
	router.DELETE("/v1/category/:category_id", middleware.AclMiddleware([]string{"ADMIN"}), categoryHandler.Deletecategory)
	router.PUT("/v1/category/:category_id", middleware.AclMiddleware([]string{"ADMIN"}), categoryHandler.Updatecategory)

}
