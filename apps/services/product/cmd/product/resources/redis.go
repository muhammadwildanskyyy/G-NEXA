package resources

import (
	"context"
	"product-service/config"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

func ConnectRedis(cfg config.RedisConfig) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// Check connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		logrus.Errorf("Failed to connect to Redis: %v", err)
		return nil
	}

	logrus.Info("Successfully connected to Redis")
	return rdb
}
