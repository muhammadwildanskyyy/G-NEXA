package resources

import (
	"finance/config"
	"fmt"

	"github.com/xendit/xendit-go/v7"
)

func InitXendit(config *config.AppConfig) *xendit.APIClient {
	fmt.Println("InitXendit", config.Xendit.APIKey)
	client := xendit.NewClient(config.Xendit.APIKey)
	return client
}
