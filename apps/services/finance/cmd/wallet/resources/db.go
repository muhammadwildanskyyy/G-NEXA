package resources

import (
	"context"
	"errors"
	"fmt"
	"time"

	"finance/config"
	gnexalogger "finance/infrastructure/logger"

	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type GormGNEXALogger struct {
	LogLevel gormlogger.LogLevel
}

func (l *GormGNEXALogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	newLogger := *l
	newLogger.LogLevel = level
	return &newLogger
}

func (l *GormGNEXALogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Info {
		gnexalogger.Info(ctx, "repository:gorm", fmt.Sprintf(msg, data...), nil)
	}
}

func (l *GormGNEXALogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Warn {
		gnexalogger.Warn(ctx, "repository:gorm", fmt.Sprintf(msg, data...), nil)
	}
}

func (l *GormGNEXALogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Error {
		gnexalogger.Error(ctx, "repository:gorm", fmt.Sprintf(msg, data...), nil, nil)
	}
}

func (l *GormGNEXALogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	if l.LogLevel <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()

	fields := logrus.Fields{
		"duration": elapsed.String(),
		"rows":     rows,
		"query":    sql,
	}

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		gnexalogger.Error(ctx, "repository:gorm", "Database Query Error", err, fields)
	} else {
		gnexalogger.Debug(ctx, "repository:gorm", "GORM Query Executed", fields)
	}
}

func InitDB(cfg *config.AppConfig) *gorm.DB {
	ctx := context.Background()

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.Name)

	var gormLogLevel gormlogger.LogLevel
	if cfg.App.Env == "production" {
		gormLogLevel = gormlogger.Error
	} else {
		gormLogLevel = gormlogger.Info
	}

	// 4. Injeksi Adapter ke dalam Konfigurasi GORM
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: &GormGNEXALogger{
			LogLevel: gormLogLevel,
		},
	})

	if err != nil {

		gnexalogger.Error(ctx, "infra:database", "Failed to connect to DB", err, nil)
		panic(err)
	}

	gnexalogger.Info(ctx, "infra:database", "Successfully connected to Finance DB", nil)
	return db
}
