package middleware

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"

	"media-service/infrastructure/logger"
	"media-service/utils"
)

func AuthMiddleware(secret string) fiber.Handler {
	return func(c fiber.Ctx) error {

		traceID, _ := c.Locals("trace_id").(string)

		ctx := context.WithValue(context.Background(), "trace_id", traceID)

		authHeader := c.Get("Authorization")
		if authHeader == "" {

			logger.Warn(ctx, "middleware:auth", "Authentication failed: Authorization header is empty", nil)
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Authorization header is empty")
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			logger.Warn(ctx, "middleware:auth", "Authentication failed: Invalid header format", nil)
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Authorization header format must be Bearer {token}")
		}

		tokenString := tokenParts[1]

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Unexpected signing method")
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			errFields := logrus.Fields{}
			if err != nil {
				errFields["error"] = err.Error()
			}
			logger.Warn(ctx, "middleware:auth", "Authentication failed: Invalid or expired token", errFields)
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Warn(ctx, "middleware:auth", "Authentication failed: Invalid token claims format", nil)
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Invalid token claims")
		}

		userID, okID := claims["user_id"].(string)
		userRole, okRole := claims["user_role"].(string)

		if !okID || !okRole {
			logger.Warn(ctx, "middleware:auth", "Authentication failed: Token missing user identification", nil)
			return utils.ResponseError(c, fiber.StatusUnauthorized, "Token missing user identification")
		}

		c.Locals("user_id", userID)
		c.Locals("user_role", userRole)

		ctx = context.WithValue(ctx, "user_id", userID)

		logger.Info(ctx, "middleware:auth", "User authenticated successfully", logrus.Fields{
			"role": userRole,
		})

		return c.Next()
	}
}
