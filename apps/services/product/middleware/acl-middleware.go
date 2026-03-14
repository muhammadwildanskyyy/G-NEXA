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
		ctx := c.Request.Context()

		// 1. Check for User Role in Gin Context (usually set by AuthMiddleware)
		val, exists := c.Get("user_role")
		if !exists {
			logger.Warn(ctx, "middleware:acl", "Access denied: User role missing from context", logrus.Fields{
				"path":          c.Request.URL.Path,
				"allowed_roles": allowedRoles,
			})
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		userRole, ok := val.(string)
		if !ok {
			logger.Warn(ctx, "middleware:acl", "Access denied: Invalid user role type", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		// 2. Role Validation Logic
		isAllowed := false
		for _, r := range allowedRoles {
			if r == userRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			logger.Warn(ctx, "middleware:acl", "Access denied: Role not authorized", logrus.Fields{
				"user_role":     userRole,
				"allowed_roles": allowedRoles,
				"path":          c.Request.URL.Path,
			})
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		// Silent success: move to next handler
		c.Next()
	}
}
