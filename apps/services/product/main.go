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
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// init
	config := config.LoadConfig()
	port := config.App.Port
	db := resources.ConnectMongoDB(config.Databasee)
	logger.SetupLogger()

	// category
	categoryRepository := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepository)
	categoryUsecase := usecases.NewCategoryUsecase(categoryService)
	categoryHandler := handlers.NewCategoryHandler(categoryUsecase)

	// product
	productRepository := repositories.NewProductRepository(db)
	productService := services.NewProductService(productRepository, categoryRepository, config.HostService)
	productUseCase := usecases.NewProductUsecase(productService)
	productHandler := handlers.NewProductHandler(productUseCase)

	// routing
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(router, productHandler, categoryHandler, config.App.AuthSecret)

	logger.Log.Println("Server run on port " + port)
	router.Run(":" + port)
}
