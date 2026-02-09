package resources

import (
	"context"
	"log"
	"product-service/config"
	"time"

	"go.mongodb.org/mongo-driver/event"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectMongoDB(cfg config.DatabaseConfig) *mongo.Database {
	// 1. Langsung pakai URI String dari Config
	uri := cfg.ConnectionURI

	// 2. Setup Client Options
	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetMonitor(getMonitor()) // Logger tetap nyala

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 3. Connect
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("Fatal: Gagal connect ke Mongo: %v", err)
	}

	// 4. Ping
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Fatal: Ping Mongo gagal: %v", err)
	}

	log.Println("✅ Berhasil terhubung ke MongoDB!")

	return client.Database(cfg.Name)
}

// getMonitor mengembalikan konfigurasi event listener untuk logging
func getMonitor() *event.CommandMonitor {
	return &event.CommandMonitor{
		// Callback saat Query DIMULAI
		Started: func(ctx context.Context, evt *event.CommandStartedEvent) {
			// Filter: Jangan logger perintah sistem internal (biar gak spam)
			if evt.CommandName == "ping" || evt.CommandName == "hello" || evt.CommandName == "ismaster" {
				return
			}

			// Print Query (JSON Raw)
			log.Printf("📝 [MONGO-REQ] Command: %s | Payload: %s", evt.CommandName, evt.Command)
		},

		// Callback saat Query SUKSES
		Succeeded: func(ctx context.Context, evt *event.CommandSucceededEvent) {
			if evt.CommandName == "ping" || evt.CommandName == "hello" || evt.CommandName == "ismaster" {
				return
			}
			log.Printf("✅ [MONGO-OK]  Command: %s | Duration: %dms", evt.CommandName, evt.DurationNanos/1e6)
		},

		// Callback saat Query GAGAL
		Failed: func(ctx context.Context, evt *event.CommandFailedEvent) {
			log.Printf("❌ [MONGO-ERR] Command: %s | Error: %s", evt.CommandName, evt.Failure)
		},
	}
}
