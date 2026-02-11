package middleware

import (
	"context"
	"media-service/infrastructure/logger"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func RequestLogger() fiber.Handler {
	return func(c fiber.Ctx) error {
		requestId := uuid.New().String()
		timeoutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		ctx := context.WithValue(timeoutCtx, "request_id", requestId)
		c.SetContext(ctx)
		c.Set("X-Request-ID", requestId)

		startTime := time.Now()

		err := c.Next()

		latency := time.Since(startTime)
		statusCode := c.Response().StatusCode()

		requestLog := logrus.Fields{
			"request_id": requestId,
			"method":     c.Method(),
			"path":       c.Path(),
			"status":     statusCode,
			"latency":    latency.String(),
			"ip":         c.IP(),
		}

		// 5. Logging berdasarkan status code
		if statusCode >= 200 && statusCode < 300 {
			logger.Log.WithFields(requestLog).Info("Request Processed Successfully")
		} else {

			if err != nil {
				requestLog["error"] = err.Error()
			}
			logger.Log.WithFields(requestLog).Warn("Request Finished with Issues")
		}

		return err
	}
}
