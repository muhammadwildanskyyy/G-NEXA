package middleware

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"media-service/infrastructure/logger"
)

func RequestLogger() fiber.Handler {
	return func(c fiber.Ctx) error {

		traceId := c.Get("X-Correlation-ID")
		if traceId == "" {
			traceId = uuid.New().String()
		}

		c.Set("X-Correlation-ID", traceId)
		c.Locals("trace_id", traceId)

		ctx := context.WithValue(context.Background(), "trace_id", traceId)

		startTime := time.Now()
		method := c.Method()
		path := c.Path()

		incomingFields := logrus.Fields{
			"method":     method,
			"path":       path,
			"ip":         c.IP(),
			"user_agent": c.Get("User-Agent"),
		}

		logger.Info(ctx, "delivery:http", "Incoming HTTP request", incomingFields)

		err := c.Next()

		if userID, ok := c.Locals("user_id").(string); ok && userID != "" {

			ctx = context.WithValue(ctx, "user_id", userID)
		}

		latency := time.Since(startTime)
		statusCode := c.Response().StatusCode()

		outgoingFields := logrus.Fields{
			"method":  method,
			"path":    path,
			"status":  statusCode,
			"latency": latency.String(),
		}

		if statusCode >= 500 {
			
			logger.Error(ctx, "delivery:http", "HTTP request finished with server error", err, outgoingFields)
		} else if statusCode >= 400 {
			if err != nil {
				outgoingFields["error"] = err.Error()
			}
			logger.Warn(ctx, "delivery:http", "HTTP request finished with client error", outgoingFields)
		} else {
			logger.Info(ctx, "delivery:http", "HTTP request completed successfully", outgoingFields)
		}

		return err
	}
}
