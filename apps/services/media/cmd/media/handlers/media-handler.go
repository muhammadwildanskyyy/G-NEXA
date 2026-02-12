package handlers

import (
	"media-service/cmd/media/services"
	"media-service/infrastructure/logger"
	"media-service/model"
	"media-service/utils"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"
)

// MediaHandler interface sesuai standar abstraksi GNEXA
type MediaHandler interface {
	Upload(c fiber.Ctx) error
	Uploads(c fiber.Ctx) error
	Delete(c fiber.Ctx) error
	BatchDeletes(c fiber.Ctx) error
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

func (h *mediaHandler) Uploads(c fiber.Ctx) error {

	userID := c.Context().Value("user_id")

	logFields := logrus.Fields{
		"layer":   "Handler",
		"func":    "Upload",
		"user_id": userID,
	}

	form, err := c.MultipartForm()
	if err != nil {
		logger.LogError(logFields, "File missing in request", "c.FormFile()", err)
		return utils.ResponseError(c, fiber.StatusBadRequest, "File is required")
	}

	filesHeader := form.File["files"]
	if len(filesHeader) == 0 {
		logger.Log.WithFields(logFields).Warn("No files found in request")
		return utils.ResponseError(c, fiber.StatusBadRequest, "At least one file is required")
	}

	res, err := h.svc.UploadFiles(c.Context(), filesHeader)
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

func (h *mediaHandler) BatchDeletes(c fiber.Ctx) error {

	req := new(model.DeleteBulkRequest)

	if err := c.Bind().Body(req); err != nil {
		return utils.ResponseError(c, fiber.StatusBadRequest, "Invalid request body format")
	}

	userID := c.Context().Value("user_id")

	logFields := logrus.Fields{
		"layer":     "Handler",
		"func":      "BatchDeletes",
		"media_ids": req.IDs,
		"user_id":   userID,
		"ip":        c.IP(),
	}

	if len(req.IDs) == 0 {
		logger.Log.WithFields(logFields).Warn("Batch delete attempted with empty IDs")
		return utils.ResponseError(c, fiber.StatusBadRequest, "At least one Media ID is required")
	}

	if err := h.svc.DeleteFiles(c.Context(), req.IDs); err != nil {
		logger.LogError(logFields, "Service batch delete failed", "h.svc.DeleteFiles()", err)
		return utils.ResponseError(c, fiber.StatusInternalServerError, "Failed to delete files")
	}

	return utils.ResponseSuccess(c, nil, "Multiple media deleted successfully", fiber.StatusOK)
}
