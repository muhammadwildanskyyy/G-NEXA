package middleware

import (
	"context"
	"net/http"
	"product-service/infrastructure/logger"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func TracingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Extract or Generate Trace ID (Correlation ID)
		traceID := c.GetHeader("X-Correlation-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}

		// 2. Set Trace ID in Response Header (Useful for debugging)
		c.Writer.Header().Set("X-Correlation-ID", traceID)

		// 3. Inject Trace ID into Go Context (Standard Context)
		// This is what our logger.extract() function looks for
		ctx := context.WithValue(c.Request.Context(), "trace_id", traceID)

		if userID, exists := c.Get("user_id"); exists {
			ctx = context.WithValue(ctx, "user_id", userID)
		}

		c.Request = c.Request.WithContext(ctx)

		// 4. Log Incoming Request (Minimalist)
		startTime := time.Now()
		logger.Info(ctx, "delivery:http", "Incoming request", logrus.Fields{
			"method": c.Request.Method,
			"path":   c.Request.URL.Path,
			"ip":     c.ClientIP(),
		})

		c.Next()

		// 5. Log Request Completion
		latency := time.Since(startTime)
		status := c.Writer.Status()

		fields := logrus.Fields{
			"status":  status,
			"latency": latency.String(),
		}

		if status >= http.StatusBadRequest {
			logger.Warn(ctx, "delivery:http", "Request finished with error", fields)
		} else {

			logger.Info(ctx, "delivery:http", "Request finished successfully", fields)
		}
	}
}
