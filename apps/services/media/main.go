package main

import (
	"context"
	"media-service/cmd/media/handlers"
	"media-service/cmd/media/repositories"
	"media-service/cmd/media/resources"
	"media-service/cmd/media/services"
	"media-service/config"
	"media-service/infrastructure/logger"
	"media-service/middleware"
	"media-service/model"
	"media-service/routes"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"
)

func main() {

	cfg := config.LoadConfig()
	logger.SetupLogger(cfg)

	ctx := context.Background()

	db := resources.InitDB(cfg)

	err := db.AutoMigrate(&model.Media{}) // Pastikan menggunakan pointer &model.Media{}
	if err != nil {
		logger.Error(ctx, "infra:database", "Failed to run auto migration", err, nil)
	} else {
		logger.Info(ctx, "infra:database", "Auto migration completed", nil)
	}

	mediaRepositories := repositories.NewMediaRepository(db)
	mediaServices := services.NewMediaService(mediaRepositories, cfg.Cloudinary.CLOUDINARY_URL, cfg.Cloudinary.CLOUDINARY_FOLDER)
	mediaHandler := handlers.NewMediaHandler(mediaServices)

	app := fiber.New(fiber.Config{
		AppName: "GNEXA Media Service v1.0",
	})

	app.Use(middleware.RequestLogger())

	routes.SetupRouter(app, mediaHandler, cfg.App.AuthSecret)

	logger.Info(ctx, "infra:bootstrap", "Server GNEXA running", logrus.Fields{
		"port": cfg.App.Port,
	})

	if err := app.Listen(":" + cfg.App.Port); err != nil {
		logger.Error(ctx, "infra:bootstrap", "Failed to start server", err, nil)
	}
}
