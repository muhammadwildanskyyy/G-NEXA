package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ResponseSuccess(c *gin.Context, data interface{}, message string, code int) {
	c.JSON(code, gin.H{
		"meta": gin.H{
			"code": code,
			"msg":  message,
		},
		"data": data,
	})
}

func ResponseError(c *gin.Context, code int, errMessage string) {

	finalMessage := errMessage
	if gin.Mode() == gin.ReleaseMode {
		finalMessage = http.StatusText(code)
	}

	c.JSON(code, gin.H{
		"meta": gin.H{
			"code": code,
			"msg":  finalMessage,
		},
		"data": nil,
	})
}
