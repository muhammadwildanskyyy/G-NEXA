package utils

import (
	"net/http"
	"os"

	"github.com/gofiber/fiber/v3"
)

func ResponseSuccess(c fiber.Ctx, data interface{}, message string, code int) error {
	return c.Status(code).JSON(fiber.Map{
		"meta": fiber.Map{
			"code":    code,
			"message": message,
		},
		"data": data,
	})
}

func ResponseError(c fiber.Ctx, code int, errMessage string) error {
	finalMessage := errMessage

	if os.Getenv("APP_ENV") == "production" {
		finalMessage = http.StatusText(code)
	}

	return c.Status(code).JSON(fiber.Map{
		"meta": fiber.Map{
			"code":    code,
			"message": finalMessage,
		},
		"data": nil,
	})
}
