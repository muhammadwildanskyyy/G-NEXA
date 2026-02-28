package main

import (
	"fmt"
	"product-service/cmd/product/handlers"
	"product-service/cmd/product/repositories"
	"product-service/cmd/product/resources"
	"product-service/cmd/product/services"
	"product-service/cmd/product/usecases"
	"product-service/config"
	"product-service/infrastructure/logger"
	"product-service/routes"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Setup Configuration & Logging
	config := config.LoadConfig()
	logger.SetupLogger(config) // Setup our custom Logrus formatter

	// 2. Initialize Resources (Database)
	db := resources.ConnectMongoDB(config.Databasee)

	// 3. Dependency Injection: Category Module
	categoryRepository := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepository)
	categoryUsecase := usecases.NewCategoryUsecase(categoryService)
	categoryHandler := handlers.NewCategoryHandler(categoryUsecase)

	// 4. Dependency Injection: Product Module
	productRepository := repositories.NewProductRepository(db)
	productService := services.NewProductService(productRepository, categoryRepository, config.HostService)
	productUseCase := usecases.NewProductUsecase(productService)
	productHandler := handlers.NewProductHandler(productUseCase)

	// 5. Setup Router
	if config.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
		
	}
	router := gin.New() // Use gin.New() to have full control over middlewares

	// 6. Global Middlewares
	router.Use(gin.Recovery()) // Recovery from panics, ideally logged by our custom logger

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"}, // Added common frontend ports
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Correlation-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 7. Routes Setup
	routes.SetupRoutes(router, productHandler, categoryHandler, config.App.AuthSecret)

	// 8. Start Server
	port := config.App.Port
	logger.Info(nil, "APP", fmt.Sprintf("Server starting in localhost:%v", port), map[string]interface{}{
		"port": port,
	})

	if err := router.Run(":" + port); err != nil {
		logger.Error(nil, "APP", "Failed to start server", err, nil)
	}
}
