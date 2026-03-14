package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"finance/infrastructure/logger" // Sesuaikan dengan path Anda
	"finance/utils"                 // Sesuaikan dengan path Anda
)

func AclMiddleware(allowedRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {

		ctx := c.Request.Context()

		baseFields := logrus.Fields{
			"path":          c.Request.URL.Path,
			"allowed_roles": allowedRoles,
		}

		val, exists := c.Get("user_role")
		if !exists {
			logger.Warn(ctx, "middleware:acl", "User role not found in context (AuthMiddleware might have failed)", baseFields)
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		userRole, ok := val.(string)
		if !ok {
			logger.Warn(ctx, "middleware:acl", "User role in context is not a valid string", baseFields)
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		baseFields["user_role"] = userRole

		isAllowed := false
		for _, r := range allowedRoles {
			if r == userRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			logger.Warn(ctx, "middleware:acl", "Access Denied: User role does not match allowed roles", baseFields)
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		c.Next()
	}
}
