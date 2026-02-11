package handlers

import (
	"media-service/cmd/media/services"
	"media-service/infrastructure/logger"
	"media-service/utils"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"
)

// MediaHandler interface sesuai standar abstraksi GNEXA
type MediaHandler interface {
	Upload(c fiber.Ctx) error
	Delete(c fiber.Ctx) error
}

type mediaHandler struct {
	svc services.MediaStorage
}

func NewMediaHandler(svc services.MediaStorage) MediaHandler {
	return &mediaHandler{svc: svc}
}

func (h *mediaHandler) Upload(c fiber.Ctx) error {

	userID := c.Context().Value("user_id")

	logFields := logrus.Fields{
		"layer":   "Handler",
		"func":    "Upload",
		"user_id": userID,
	}

	file, err := c.FormFile("file")
	if err != nil {
		logger.LogError(logFields, "File missing in request", "c.FormFile()", err)
		return utils.ResponseError(c, fiber.StatusBadRequest, "File is required")
	}

	res, err := h.svc.UploadFile(c.Context(), file)
	if err != nil {
		logger.LogError(logFields, "Service upload failed", "h.svc.UploadFile()", err)
		return utils.ResponseError(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.ResponseSuccess(c, res, "Upload success", fiber.StatusCreated)
}

func (h *mediaHandler) Delete(c fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Context().Value("user_id")

	logFields := logrus.Fields{
		"layer":    "Handler",
		"func":     "Delete",
		"media_id": id,
		"user_id":  userID,
	}

	if id == "" {
		return utils.ResponseError(c, fiber.StatusBadRequest, "Media ID is required")
	}

	// Eksekusi delete melalui service
	if err := h.svc.DeleteFile(c.Context(), id); err != nil {
		logger.LogError(logFields, "Service delete failed", "h.svc.DeleteFile()", err)
		return utils.ResponseError(c, fiber.StatusInternalServerError, "Failed to delete or media not found")
	}

	return utils.ResponseSuccess(c, nil, "Media deleted successfully", fiber.StatusOK)
}
