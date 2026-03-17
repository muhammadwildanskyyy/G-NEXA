package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"

	"media-service/cmd/media/services"
	"media-service/infrastructure/logger"
	"media-service/model"
	"media-service/utils"
)

type MediaHandler interface {
	Upload(c fiber.Ctx) error
	Uploads(c fiber.Ctx) error
	Delete(c fiber.Ctx) error
	BatchDeletes(c fiber.Ctx) error
	GetByID(c fiber.Ctx) error
}

type mediaHandler struct {
	svc services.MediaStorage
}

func NewMediaHandler(svc services.MediaStorage) MediaHandler {
	return &mediaHandler{svc: svc}
}

func buildGNEXAContext(c fiber.Ctx) context.Context {
	ctx := context.Background()

	if traceID, ok := c.Locals("trace_id").(string); ok {
		ctx = context.WithValue(ctx, "trace_id", traceID)
	}
	if userID, ok := c.Locals("user_id").(string); ok {
		ctx = context.WithValue(ctx, "user_id", userID)
	}

	return ctx
}

func (h *mediaHandler) Upload(c fiber.Ctx) error {
	ctx := buildGNEXAContext(c)

	file, err := c.FormFile("file")
	if err != nil {
		// Klien lupa melampirkan file -> Client Error (Warn)
		logger.Warn(ctx, "handler:media", "File missing in request", logrus.Fields{
			"error": err.Error(),
		})
		return utils.ResponseError(c, fiber.StatusBadRequest, "File is required")
	}

	res, err := h.svc.UploadFile(ctx, file)
	if err != nil {
		// Log detail error sudah ditangani di Service layer, di sini kita tangkap hasil akhirnya
		logger.Error(ctx, "handler:media", "Service upload failed", err, nil)
		return utils.ResponseError(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.ResponseSuccess(c, res, "Upload success", fiber.StatusCreated)
}

func (h *mediaHandler) Uploads(c fiber.Ctx) error {
	ctx := buildGNEXAContext(c)

	form, err := c.MultipartForm()
	if err != nil {
		logger.Warn(ctx, "handler:media", "Failed to parse multipart form", logrus.Fields{
			"error": err.Error(),
		})
		return utils.ResponseError(c, fiber.StatusBadRequest, "Invalid multipart form data")
	}

	filesHeader := form.File["files"]
	if len(filesHeader) == 0 {
		logger.Warn(ctx, "handler:media", "No files found in request payload", nil)
		return utils.ResponseError(c, fiber.StatusBadRequest, "At least one file is required")
	}

	res, err := h.svc.UploadFiles(ctx, filesHeader)
	if err != nil {
		logger.Error(ctx, "handler:media", "Service batch upload failed", err, nil)
		return utils.ResponseError(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.ResponseSuccess(c, res, "Batch upload success", fiber.StatusCreated)
}

func (h *mediaHandler) Delete(c fiber.Ctx) error {
	ctx := buildGNEXAContext(c)
	id := c.Params("id")

	if id == "" {
		logger.Warn(ctx, "handler:media", "Media ID is missing in params", nil)
		return utils.ResponseError(c, fiber.StatusBadRequest, "Media ID is required")
	}

	if err := h.svc.DeleteFile(ctx, id); err != nil {
		logger.Error(ctx, "handler:media", "Service delete failed", err, logrus.Fields{
			"media_id": id,
		})
		return utils.ResponseError(c, fiber.StatusInternalServerError, "Failed to delete media or media not found")
	}

	return utils.ResponseSuccess(c, nil, "Media deleted successfully", fiber.StatusOK)
}

func (h *mediaHandler) BatchDeletes(c fiber.Ctx) error {
	ctx := buildGNEXAContext(c)
	req := new(model.DeleteBulkRequest)

	if err := c.Bind().Body(req); err != nil {
		logger.Warn(ctx, "handler:media", "Invalid request body format", logrus.Fields{
			"error": err.Error(),
		})
		return utils.ResponseError(c, fiber.StatusBadRequest, "Invalid request body format")
	}

	if len(req.IDs) == 0 {
		logger.Warn(ctx, "handler:media", "Batch delete attempted with empty IDs array", nil)
		return utils.ResponseError(c, fiber.StatusBadRequest, "At least one Media ID is required")
	}

	if err := h.svc.DeleteFiles(ctx, req.IDs); err != nil {
		logger.Error(ctx, "handler:media", "Service batch delete failed", err, logrus.Fields{
			"media_ids": req.IDs,
		})
		return utils.ResponseError(c, fiber.StatusInternalServerError, "Failed to delete files")
	}

	return utils.ResponseSuccess(c, nil, "Multiple media deleted successfully", fiber.StatusOK)
}

func (h *mediaHandler) GetByID(c fiber.Ctx) error {
	ctx := buildGNEXAContext(c)
	id := c.Params("id")

	if id == "" {
		return utils.ResponseError(c, fiber.StatusBadRequest, "Media ID is required")
	}

	res, err := h.svc.GetMediaByID(ctx, id)
	if err != nil {
		return utils.ResponseError(c, fiber.StatusNotFound, "Media not found")
	}

	return utils.ResponseSuccess(c, res, "Media retrieved successfully", fiber.StatusOK)
}
