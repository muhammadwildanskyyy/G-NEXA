package main

import (
	"log"
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
	fiberLogger "github.com/gofiber/fiber/v3/middleware/logger"
)

func main() {
	cfg := config.LoadConfig()
	// Database Connection
	db := resources.InitDB(cfg)
	// Auto Migration
	db.AutoMigrate(model.Media{})
	logger.SetupLogger()

	// Media
	mediaRepositories := repositories.NewMediaRepository(db)
	mediaServices := services.NewMediaService(mediaRepositories, cfg.Cloudinary.CLOUDINARY_URL, cfg.Cloudinary.CLOUDINARY_FOLDER)
	mediaHandler := handlers.NewMediaHandler(mediaServices)

	// Inisialisasi Fiber v3
	app := fiber.New(fiber.Config{
		AppName: "GNEXA Media Service v1.0",
	})

	app.Use(fiberLogger.New())
	app.Use(middleware.RequestLogger())

	routes.SetupRouter(app, mediaHandler, cfg.App.AuthSecret)

	log.Printf("Server GNEXA running on port %s", cfg.App.Port)
	log.Fatal(app.Listen(":" + cfg.App.Port))
}
