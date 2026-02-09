package middleware

import (
	"net/http"
	"product-service/utils"

	"github.com/gin-gonic/gin"
)

func AclMiddleware(allowedRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {

		val, exists := c.Get("user_role")
		if !exists {
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		userRole := val.(string)
		isAllowed := false

		for _, r := range allowedRoles {
			if r == userRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			utils.ResponseError(c, http.StatusUnauthorized, "access not permitted")
			c.Abort()
			return
		}

		c.Next()
	}
}
