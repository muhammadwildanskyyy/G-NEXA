package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"product-service/cmd/product/handlers"
	"product-service/cmd/product/repositories"
	"product-service/cmd/product/resources"
	"product-service/cmd/product/services"
	"product-service/cmd/product/usecases"
	"product-service/config"
	"product-service/infrastructure/delivery/kafka"
	grpcHandler "product-service/infrastructure/grpc"
	grpcclient "product-service/infrastructure/grpc-client"
	"product-service/infrastructure/logger"
	"product-service/proto/productPb"
	"product-service/routes"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	// 1. Setup Configuration & Logging
	config := config.LoadConfig()
	logger.SetupLogger(config) // Setup our custom Logrus formatter

	// 2. Initialize Resources (Database)
	db := resources.ConnectMongoDB(config.Databasee)
	rdb := resources.ConnectRedis(config.Redis)

	// 3. Dependency Injection: Category Module
	categoryRepository := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepository)
	categoryUsecase := usecases.NewCategoryUsecase(categoryService, rdb)
	categoryHandler := handlers.NewCategoryHandler(categoryUsecase)

	// 4. Initialize gRPC Client for User Service
	userGrpcClient, err := grpcclient.NewUserGrpcClient(config.HostService.UserGrpcUrl)
	if err != nil {
		logger.Error(ctx, "infra:bootstrap", "Failed to initialize User gRPC client", err, nil)
	}

	// 5. Dependency Injection: Product Module
	productRepository := repositories.NewProductRepository(db)
	productService := services.NewProductService(productRepository, categoryRepository, config.HostService, userGrpcClient)
	productUseCase := usecases.NewProductUsecase(productService, rdb)
	productHandler := handlers.NewProductHandler(productUseCase)
	fmt.Println(config.Kafka.TopicOrder)
	consumer := kafka.NewConsumer([]string{config.Kafka.Broker}, config.Kafka.TopicOrder, "product-group")
	go func() {
		consumer.Start(ctx, func(c context.Context, msg []byte) error {
			return kafka.HandlerConsumer(c, msg, productUseCase)
		})
	}()

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
	srv := &http.Server{
		Addr:    ":" + config.App.Port,
		Handler: router,
	}

	go func() {
		logger.Info(ctx, "infra:bootstrap", "Server HTTP Gin is running", logrus.Fields{
			"port": config.App.Port,
		})
		// Gunakan ListenAndServe, bukan router.Run
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(ctx, "infra:bootstrap", "Failed to start Gin HTTP Server", err, nil)
		}
	}()

	// 9. grpc setup
	productGrpcHandler := grpcHandler.NewProductGrpcServer(productUseCase)
	grpcServer := grpc.NewServer()
	productPb.RegisterProductServiceServer(grpcServer, productGrpcHandler)
	reflection.Register(grpcServer)

	grpcPort := config.App.GrpcPort
	if grpcPort == "" {
		grpcPort = "50051"
	}

	lis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		logger.Error(ctx, "infra:bootstrap", "Failed to listen on gRPC port", err, nil)
	}
	go func() {
		logger.Info(ctx, "infra:bootstrap", "Server gRPC is running", logrus.Fields{
			"port": grpcPort,
		})
		if err := grpcServer.Serve(lis); err != nil {
			logger.Error(ctx, "infra:bootstrap", "Failed to start gRPC Server", err, nil)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Warn(ctx, "infra:bootstrap", "Received OS shutdown signal, initiating graceful shutdown...", nil)

	ctxShutdown, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShutdown()

	// 1. Shutdown HTTP Server
	if err := srv.Shutdown(ctxShutdown); err != nil {
		logger.Error(ctxShutdown, "infra:bootstrap", "HTTP Server forced to shutdown", err, nil)
	} else {
		logger.Info(ctx, "infra:bootstrap", "HTTP Server closed successfully", nil)
	}

	// 2. Shutdown gRPC Server
	logger.Info(ctx, "infra:bootstrap", "Shutting down gRPC Server...", nil)
	grpcServer.GracefulStop() // Menghentikan gRPC dengan aman
	logger.Info(ctx, "infra:bootstrap", "gRPC Server closed successfully", nil)

	cancel() // Cancel context global

	// 3. Shutdown Kafka Consumer
	if err := consumer.Close(); err != nil {
		logger.Error(ctx, "infra:kafka", "Error while closing Kafka consumer", err, nil)
	} else {
		logger.Info(ctx, "infra:kafka", "Kafka consumer closed successfully", nil)
	}
}
