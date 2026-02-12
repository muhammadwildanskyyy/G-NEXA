package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

func LoadConfig() *AppConfig {
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./files/config")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {

		if _, ok := err.(viper.ConfigFileNotFoundError); ok {

			log.Println("Warning: File .env tidak ditemukan di root maupun files/config. Menggunakan System Env Vars.")
		} else {

			log.Fatalf("Fatal: Error membaca file config: %v", err)
		}
	}

	var config AppConfig
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Fatal: Gagal parsing config: %v", err)
	}

	return &config
}
