package middleware

import (
	"net/http"
	"product-service/infrastructure/logger"
	"product-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func AclMiddleware(allowedRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Setup Base Log Fields
		logFields := logrus.Fields{
			"layer":         "Middleware",
			"func":          "AclMiddleware()",
			"path":          c.Request.URL.Path,
			"allowed_roles": allowedRoles,
		}

		if userID, exists := c.Get("user_id"); exists {
			logFields["user_id"] = userID
		}

		val, exists := c.Get("user_role")
		if !exists {
			logger.Log.WithFields(logFields).Warn("🚨 User role not found in context (AuthMiddleware might have failed)")
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		userRole, ok := val.(string)
		if !ok {
			logger.Log.WithFields(logFields).Warn("🚨 User role in context is not a string")
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		logFields["user_role"] = userRole

		isAllowed := false
		for _, r := range allowedRoles {
			if r == userRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			logger.Log.WithFields(logFields).Warn("⛔ Access Denied: User role does not match allowed roles")
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		c.Next()
	}
}
