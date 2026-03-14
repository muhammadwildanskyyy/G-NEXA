package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"finance/infrastructure/logger"
)

func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {

		traceID := c.GetHeader("X-Correlation-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}

		c.Header("X-Correlation-ID", traceID)
		c.Set("trace_id", traceID)

		timeoutCtx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		ctx := context.WithValue(timeoutCtx, "trace_id", traceID)
		c.Request = c.Request.WithContext(ctx)

		startTime := time.Now()
		method := c.Request.Method
		path := c.Request.URL.Path

		incomingFields := logrus.Fields{
			"method":     method,
			"path":       path,
			"ip":         c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
		}
		logger.Info(ctx, "delivery:http", "Incoming HTTP request", incomingFields)

		c.Next()

		if userID, exists := c.Get("user_id"); exists {
			if userIDStr, ok := userID.(string); ok && userIDStr != "" {
				ctx = context.WithValue(ctx, "user_id", userIDStr)
			}
		}

		latency := time.Since(startTime)
		statusCode := c.Writer.Status()

		outgoingFields := logrus.Fields{
			"method":  method,
			"path":    path,
			"status":  statusCode,
			"latency": latency.String(),
		}

		if len(c.Errors) > 0 {
			outgoingFields["error"] = c.Errors.String()
		}

		if statusCode >= 500 {
			var err error
			if len(c.Errors) > 0 {
				err = c.Errors.Last().Err
			}
			logger.Error(ctx, "delivery:http", "HTTP request finished with server error", err, outgoingFields)
		} else if statusCode >= 400 {
			logger.Warn(ctx, "delivery:http", "HTTP request finished with client error", outgoingFields)
		} else {
			logger.Info(ctx, "delivery:http", "HTTP request completed successfully", outgoingFields)
		}
	}
}
