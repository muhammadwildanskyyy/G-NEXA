package main

import (
	"context"
	"finance/cmd/wallet/repositories"
	"finance/cmd/wallet/resources"
	"finance/cmd/wallet/services"
	"finance/cmd/wallet/usecases"
	"finance/config"
	"finance/infrastructure/delivery/kafka"
	"finance/infrastructure/logger"
	"finance/model"
	"finance/routes"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. SETUP CONTEXT
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 2. INISIALISASI DEPENDENCY
	config := config.LoadConfig()
	port := config.App.Port
	db := resources.InitDB(config)
	db.AutoMigrate(model.Wallet{})
	logger.SetupLogger()

	walletRepository := repositories.NewWalletrepository(db)
	walletService := services.NewWalletService(walletRepository)
	walletUseCase := usecases.NewWalletUsecase(walletService)
	fmt.Println("kafka confiq", config.Kafka.Topic)
	// 3.  KAFKA CONSUMER
	consumer := kafka.NewConsumer([]string{config.Kafka.Broker}, config.Kafka.Topic, "finance-group")
	go func() {
		consumer.Start(ctx, func(c context.Context, msg []byte) error {
			return kafka.HandlerConsumer(c, msg, walletUseCase)
		})
	}()

	// 4. SETUP ROUTING GIN
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(router, config.App.AuthSecret)

	// 5.  GIN HTTP SERVER

	go func() {
		logger.Log.Println("Server run on port " + port)
		if err := router.Run(":" + port); err != nil {
			log.Fatalf("Gagal menjalankan server HTTP Gin: %v\n", err)
		}
	}()

	// 6. TAHAN MAIN THREAD & TUNGGU SINYAL OS
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Menerima sinyal shutdown, mematikan service...")

	// 7. SHUTDOWN SEQUENCE

	cancel()

	if err := consumer.Close(); err != nil {
		log.Printf("Error saat menutup consumer: %v", err)
	}

	log.Println("Service Finance dimatikan.")
}
