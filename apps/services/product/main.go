package main

import (
	"product-service/cmd/product/handlers"
	"product-service/cmd/product/repositories"
	"product-service/cmd/product/resources"
	"product-service/cmd/product/services"
	"product-service/cmd/product/usecases"
	config "product-service/config"
	"product-service/infrastructure/logger"
	"product-service/routes"

	"github.com/gin-gonic/gin"
)

func main() {

	// init
	config := config.LoadConfig()
	port := config.App.Port
	db := resources.ConnectMongoDB(config.Databasee)
	logger.SetupLogger()

	// product
	productRepository := repositories.NewProductRepository(db)
	productService := services.NewProductService(productRepository)
	productUseCase := usecases.NewProductUsecase(productService)
	productHandler := handlers.NewProductHandler(productUseCase)

	categoryRepository := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepository)
	categoryUsecase := usecases.NewCategoryUsecase(categoryService)
	categoryHandler := handlers.NewCategoryHandler(categoryUsecase)

	// routing
	router := gin.Default()
	routes.SetupRoutes(router, productHandler, categoryHandler, config.App.AuthSecret)

	logger.Log.Println("Server run on port " + port)
	router.Run(":" + port)
}
