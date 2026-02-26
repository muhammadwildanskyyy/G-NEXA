package middleware

import (
	"finance/infrastructure/logger"
	"finance/utils"
	"net/http"

	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Setup Base Log Fields
		logFields := logrus.Fields{
			"layer": "Middleware",
			"func":  "AuthMiddleware()",
			"path":  c.Request.URL.Path,
			"ip":    c.ClientIP(),
		}

		authHeader := c.Request.Header.Get("Authorization")
		if authHeader == "" {
			logger.Log.WithFields(logFields).Warn("Authorization header is empty")
			utils.ResponseError(c, http.StatusUnauthorized, "Authorization header is empty")
			c.Abort()
			return
		}

		tokenString := strings.Split(authHeader, " ")
		if len(tokenString) != 2 {
			logger.Log.WithFields(logFields).Warn("Authorization header format is invalid (must be 'Bearer <token>')")
			utils.ResponseError(c, http.StatusUnauthorized, "Authorization header is invalid")
			c.Abort()
			return
		}

		c.Set("access_token", tokenString[1])

		token, err := jwt.Parse(tokenString[1], func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			// Menggunakan format log error seperti di repository kamu
			logger.LogError(logFields, "❌ Failed to parse or validate JWT token", "jwt.Parse()", err)
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Log.WithFields(logFields).Warn("Invalid token claims format")
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		// 2. Ambil User ID secara aman
		if userID, ok := claims["user_id"].(string); ok {
			c.Set("user_id", userID)
			// Tambahkan userID ke logFields agar log berikutnya (di controller/repo) tahu ini request siapa
			logFields["user_id"] = userID
		} else {
			logger.Log.WithFields(logFields).Warn("user_id missing or invalid in token claims")
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		// 3. Ambil User Role secara aman
		if userRole, ok := claims["user_role"].(string); ok {
			c.Set("user_role", userRole)
		} else {
			logger.Log.WithFields(logFields).Warn("user_role missing or invalid in token claims")
			utils.ResponseError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		c.Next()
	}
}
