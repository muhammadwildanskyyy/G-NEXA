package middleware

import (
	"context"
	"media-service/infrastructure/logger"
	"media-service/utils"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

func AuthMiddleware(secret string) fiber.Handler {
	return func(c fiber.Ctx) error {
		logFields := logrus.Fields{
			"layer": "Middleware",
			"func":  "AuthMiddleware",
		}

		// 1. Ambil Header Authorization
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Authorization header is empty")
		}

		// 2. Validasi Format Bearer
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Authorization header format must be Bearer {token}")
		}

		tokenString := tokenParts[1]

		// 3. Parse & Validate JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Unexpected signing method")
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			logger.LogError(logFields, "Invalid token", "jwt.Parse()", err)
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}

		// 4. Ekstrak Claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Invalid token claims")
		}

		// 5. Simpan ke Context secara aman
		ctx := c.Context()

		userID, okID := claims["user_id"].(string)
		userRole, okRole := claims["user_role"].(string)

		if !okID || !okRole {
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Token missing user identification")
		}

		// Masukkan data user ke dalam context
		ctx = context.WithValue(ctx, "user_id", userID)
		ctx = context.WithValue(ctx, "user_role", userRole)

		// Update UserContext di Fiber
		c.SetContext(ctx)

		return c.Next()
	}
}
