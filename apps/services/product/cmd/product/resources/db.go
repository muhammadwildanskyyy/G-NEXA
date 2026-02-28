package resources

import (
	"context"
	"fmt"
	"product-service/config"
	"product-service/infrastructure/logger"
	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/event"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectMongoDB(cfg config.DatabaseConfig) *mongo.Database {
	uri := cfg.ConnectionURI

	// 1. Setup Client Options dengan Monitor kustom
	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetMonitor(getMonitor())

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 2. Connect
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		logger.Error(nil, "infra:database", "Fatal: Failed to connect to MongoDB", err, nil)
		panic(err)
	}

	// 3. Ping
	if err := client.Ping(ctx, nil); err != nil {
		logger.Error(nil, "infra:database", "Fatal: MongoDB ping failed", err, nil)
		panic(err)
	}

	logger.Info(nil, "infra:database", "Database connected successfully to MongoDB", logrus.Fields{
		"db_name": cfg.Name,
	})

	return client.Database(cfg.Name)
}

// getMonitor mengintegrasikan event MongoDB ke Logger kustom kita
func getMonitor() *event.CommandMonitor {
	return &event.CommandMonitor{
		Started: func(ctx context.Context, evt *event.CommandStartedEvent) {
			if isInternalCommand(evt.CommandName) {
				return
			}
			// Gunakan logger kita, bukan log.Printf
			logger.Debug(ctx, "repository:mongodb", "Command Started", logrus.Fields{
				"command": evt.CommandName,
				"payload": evt.Command.String(),
			})
		},
		Succeeded: func(ctx context.Context, evt *event.CommandSucceededEvent) {
			if isInternalCommand(evt.CommandName) {
				return
			}
			logger.Debug(ctx, "repository:mongodb", "Command Succeeded", logrus.Fields{
				"command":  evt.CommandName,
				"duration": fmt.Sprintf("%dms", evt.DurationNanos/1e6),
			})
		},

		Failed: func(ctx context.Context, evt *event.CommandFailedEvent) {
			logger.Error(ctx, "repository:mongodb", "Command Failed", nil, logrus.Fields{
				"command": evt.CommandName,
				"error":   evt.Failure,
			})
		},
	}
}

func isInternalCommand(name string) bool {
	internal := []string{"ping", "hello", "ismaster", "buildInfo", "getFreeMonitoringStatus"}
	for _, cmd := range internal {
		if cmd == name {
			return true
		}
	}
	return false
}
