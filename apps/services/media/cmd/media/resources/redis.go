package resources

import (
	"context"
	"media-service/config"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

func InitRedis(cfg *config.AppConfig) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// Check connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		logrus.Errorf("Failed to connect to Redis: %v", err)
		return nil
	}

	logrus.Info("Successfully connected to Redis")
	return rdb
}
