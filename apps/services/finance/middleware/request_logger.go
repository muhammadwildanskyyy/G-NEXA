package middleware

import (
	"context"
	"finance/infrastructure/logger"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestId := uuid.New().String()

		timeoutCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		ctx := context.WithValue(timeoutCtx, "request_Id", requestId)
		c.Request = c.Request.WithContext(ctx)

		startTime := time.Now()
		c.Next()
		latency := time.Since(startTime)

		requestLog := logrus.Fields{
			"requestId": requestId,
			"method":    c.Request.Method,
			"path":      c.Request.URL.Path,
			"status":    c.Writer.Status(),
			"latency":   latency,
		}

		if c.Writer.Status() == http.StatusOK || c.Writer.Status() == http.StatusCreated {
			logger.Log.WithFields(requestLog).Info("Request Success")
		} else {
			logger.Log.WithFields(requestLog).Info("Request Error")
		}

	}
}
