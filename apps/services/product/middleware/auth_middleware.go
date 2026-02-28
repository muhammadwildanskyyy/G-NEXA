package middleware

import (
	"net/http"
	"product-service/infrastructure/logger"
	"product-service/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		authHeader := c.Request.Header.Get("Authorization")
		if authHeader == "" {
			logger.Warn(ctx, "middleware:auth", "Authentication denied: Missing authorization header", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "Authorization header is empty")
			c.Abort()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			logger.Warn(ctx, "middleware:auth", "Authentication denied: Invalid token format", logrus.Fields{
				"header": authHeader,
			})
			utils.ResponseError(c, http.StatusUnauthorized, "Authorization header is invalid")
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		c.Set("access_token", tokenString)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			logger.Warn(ctx, "middleware:auth", "Authentication denied: Invalid or expired token", logrus.Fields{
				"error": err.Error(),
			})
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Warn(ctx, "middleware:auth", "Authentication denied: Invalid token claims format", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		// 1. Securely Extract User ID
		userID, userOk := claims["user_id"].(string)
		if !userOk {
			logger.Warn(ctx, "middleware:auth", "Authentication denied: user_id missing in claims", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}
		c.Set("user_id", userID)

		// 2. Securely Extract User Role
		userRole, roleOk := claims["user_role"].(string)
		if !roleOk {
			logger.Warn(ctx, "middleware:auth", "Authentication denied: user_role missing in claims", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}
		c.Set("user_role", userRole)

		// Silent success for valid authentication
		c.Next()
	}
}
