package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"

	"finance/infrastructure/logger"
	"finance/utils"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {

		ctx := c.Request.Context()

		authHeader := c.Request.Header.Get("Authorization")
		if authHeader == "" {
			logger.Warn(ctx, "middleware:auth", "Authorization header is empty", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "Authorization header is empty")
			c.Abort()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			logger.Warn(ctx, "middleware:auth", "Authorization header format is invalid (must be 'Bearer <token>')", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "Authorization header is invalid")
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		c.Set("access_token", tokenString)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			errFields := logrus.Fields{}
			if err != nil {
				errFields["error"] = err.Error()
			}

			logger.Warn(ctx, "middleware:auth", "Failed to parse or validate JWT token", errFields)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Warn(ctx, "middleware:auth", "Invalid token claims format", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		userID, okID := claims["user_id"].(string)
		if !okID || userID == "" {
			logger.Warn(ctx, "middleware:auth", "user_id missing or invalid in token claims", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		userRole, okRole := claims["user_role"].(string)
		if !okRole || userRole == "" {
			logger.Warn(ctx, "middleware:auth", "user_role missing or invalid in token claims", nil)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Set("user_role", userRole)

		ctx = context.WithValue(ctx, "user_id", userID)
		c.Request = c.Request.WithContext(ctx)

		logger.Info(ctx, "middleware:auth", "User authenticated successfully", logrus.Fields{
			"role": userRole,
		})

		c.Next()
	}
}
