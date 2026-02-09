package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

func LoadConfig() *AppConfig {
	// 1. Beritahu Viper tipe file dan namanya
	viper.SetConfigName(".env") // Nama filenya ".env"
	viper.SetConfigType("env")  // Tipe filenya "env"

	// 2. Beritahu Viper lokasi pencarian (Search Paths)
	viper.AddConfigPath(".")              // 1. Cari dulu di root folder (Product-Service/)
	viper.AddConfigPath("./files/config") // 2. Jika tidak ada, cari di folder files/config (Pastikan pakai 'g')

	// 3. Setup Env Key Replacer (PENTING AGAR APP_PORT TERBACA)
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// 4. Baca Environment Variable System (Prioritas tertinggi)
	viper.AutomaticEnv()

	// 5. Eksekusi Pembacaan
	if err := viper.ReadInConfig(); err != nil {
		// Cek error spesifik
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// File tidak ketemu di root MAUPUN di files/config
			log.Println("Warning: File .env tidak ditemukan di root maupun files/config. Menggunakan System Env Vars.")
		} else {
			// File ketemu tapi error (misal permission)
			log.Fatalf("Fatal: Error membaca file config: %v", err)
		}
	}

	// ... Lanjut ke Unmarshal ...
	var config AppConfig
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Fatal: Gagal parsing config: %v", err)
	}

	return &config
}
