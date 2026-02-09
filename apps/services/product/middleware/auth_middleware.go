package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(secret string) gin.HandlerFunc {

	return func(c *gin.Context) {
		authHeader := c.Request.Header.Get("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is empty",
			})
			c.Abort()
			return
		}
		tokenString := strings.Split(authHeader, " ")
		if len(tokenString) != 2 {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is invalid",
			})
			c.Abort()
			return
		}
		token, err := jwt.Parse(tokenString[1], func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			log.Println(err)
			log.Println(secret)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid token",
			})
			c.Abort()
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// 1. Ambil User ID secara aman
		if userID, ok := claims["user_id"].(string); ok {
			c.Set("user_id", userID)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user_id invalid in token"})
			c.Abort()
			return
		}

		// 2. Ambil User Role secara aman
		if userRole, ok := claims["user_role"].(string); ok {
			c.Set("user_role", userRole)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user_role invalid in token"})
			c.Abort()
			return
		}
		c.Next()

	}

}
