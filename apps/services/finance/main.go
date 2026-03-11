package main

import (
	"context"
	"finance/cmd/wallet/handlers"
	"os"
	"os/signal"
	"syscall"
	"time"

	"finance/cmd/wallet/repositories"
	"finance/cmd/wallet/resources"
	"finance/cmd/wallet/scheduler"
	"finance/cmd/wallet/services"
	"finance/cmd/wallet/usecases"
	"finance/config"
	"finance/infrastructure/delivery/kafka"
	"finance/infrastructure/logger"
	"finance/middleware"
	"finance/model"
	"finance/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.SetupLogger(cfg)

	logger.Info(ctx, "infra:bootstrap", "Starting GNEXA Finance Service...", nil)

	db := resources.InitDB(cfg)
	xendit := resources.InitXendit(cfg)
	err := db.AutoMigrate(&model.Wallet{}, &model.Payment{}, &model.PaymentAnomaly{})
	if err != nil {
		logger.Error(ctx, "infra:database", "Failed to run auto migration", err, nil)
	} else {
		logger.Info(ctx, "infra:database", "Database auto migration completed", nil)
	}

	paymentRepository := repositories.NewPaymentRepository(db)
	walletRepository := repositories.NewWalletRepository(db)
	xenditRepository := repositories.NewXenditRepository(xendit)
	anomalyRepository := repositories.NewAnomalyRepository(db)

	paymentService := services.NewPaymentService(paymentRepository)
	walletService := services.NewWalletService(walletRepository)
	xenditService := services.NewXenditService(xenditRepository)
	anomalyService := services.NewAnomalyService(anomalyRepository)

	paymentUsecase := usecases.NewPaymentUsecase(paymentService)
	walletUseCase := usecases.NewWalletUsecase(walletService, nil, paymentUsecase, anomalyService)
	xenditUsecase := usecases.NewXenditUsecase(xenditService, paymentUsecase, walletUseCase, anomalyService)
	walletUseCase.SetXenditUsecase(xenditUsecase)

	xenditHandler := handlers.NewWebhookHandler(xenditUsecase, cfg.Xendit.WebhookSecret)
	walletHandler := handlers.NewWalletHandler(walletUseCase)

	consumer := kafka.NewConsumer([]string{cfg.Kafka.Broker}, cfg.Kafka.Topic, "finance-group")
	go func() {
		consumer.Start(ctx, func(c context.Context, msg []byte) error {
			return kafka.HandlerConsumer(c, msg, walletUseCase)
		})
	}()

	paymentSyncScheduler := scheduler.NewSchedulerService(xenditUsecase, paymentUsecase, walletUseCase)
	go paymentSyncScheduler.Start(ctx)

	router := gin.New()

	router.Use(gin.Recovery())
	router.Use(middleware.RequestLogger())

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Correlation-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(router, cfg.App.AuthSecret, walletHandler, xenditHandler)

	go func() {
		logger.Info(ctx, "infra:bootstrap", "Server HTTP Gin is running", logrus.Fields{
			"port": cfg.App.Port,
		})
		if err := router.Run(":" + cfg.App.Port); err != nil {
			logger.Error(ctx, "infra:bootstrap", "Failed to start Gin HTTP Server", err, nil)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Warn(ctx, "infra:bootstrap", "Received OS shutdown signal, initiating graceful shutdown...", nil)

	cancel()

	if err := consumer.Close(); err != nil {
		logger.Error(ctx, "infra:kafka", "Error while closing Kafka consumer", err, nil)
	} else {
		logger.Info(ctx, "infra:kafka", "Kafka consumer closed successfully", nil)
	}

	logger.Info(ctx, "infra:bootstrap", "GNEXA Finance Service successfully stopped", nil)
}
