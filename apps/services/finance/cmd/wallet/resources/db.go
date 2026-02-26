package resources

import (
	"finance/config"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
)

// InitDB init db by given cfg pointer of config.Config.
//
// It returns pointer of gorm.DB when successful.
// Otherwise, nil pointer of gorm.DB will be returned.
func InitDB(cfg *config.AppConfig) *gorm.DB {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.Name)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("failed to connect to DB: %v", err)
	}

	log.Println("Connected to DB")
	return db
}
