package routes

import (
	"media-service/cmd/media/handlers"
	"media-service/middleware"

	"github.com/gofiber/fiber/v3"
)

func SetupRouter(app fiber.Router, mediahandler handlers.MediaHandler, authSecret string) {
	// Grouping Routes
	api := app.Group("/v1/api/media")

	api.Use(middleware.AuthMiddleware(authSecret))
	api.Post("/upload", mediahandler.Upload)
	api.Post("/uploads", mediahandler.Uploads)
	api.Delete("/batch-delete", mediahandler.BatchDeletes)
	api.Get("/:id", mediahandler.GetByID)
	api.Delete("/:id", mediahandler.Delete)
}
