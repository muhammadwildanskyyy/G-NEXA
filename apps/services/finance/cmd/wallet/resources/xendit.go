package resources

import (
	"finance/config"

	"github.com/xendit/xendit-go/v7"
)

func InitXendit(config *config.AppConfig) *xendit.APIClient {
	client := xendit.NewClient(config.Xendit.APIKey)
	return client
}
