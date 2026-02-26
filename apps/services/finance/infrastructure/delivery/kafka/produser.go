package kafka

import (
	"context"
	"encoding/json"
	"log"

	"github.com/segmentio/kafka-go"
)

// EventPublisher membungkus kafka.Writer
type EventPublisher struct {
	writer *kafka.Writer
}

func NewEventPublisher(brokers []string, topic string) *EventPublisher {
	w := &kafka.Writer{
		Addr:  kafka.TCP(brokers...),
		Topic: topic,
		// Balancer Hash memastikan event dengan Key yang sama (misal UserID)
		// selalu masuk ke partisi yang sama (menjamin urutan event).
		Balancer: &kafka.Hash{},
		// SUPER PENTING UNTUK FINANCE: Pastikan semua node Kafka menyimpan data ini
		RequiredAcks: kafka.RequireAll,
		MaxAttempts:  5, // Auto-retry jika network berkedip
	}

	return &EventPublisher{writer: w}
}

// Publish mengirim event ke Kafka
func (p *EventPublisher) Publish(ctx context.Context, key string, payload interface{}) error {
	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Key:   []byte(key), // Gunakan UserID atau TransactionID sebagai Key
		Value: bytes,
	}

	// Tulis pesan secara sinkronus (karena ini finance, kita butuh kepastian)
	err = p.writer.WriteMessages(ctx, msg)
	if err != nil {
		log.Printf("Gagal mempublish event ke Kafka: %v", err)
		return err
	}

	return nil
}

// Close wajib dipanggil saat aplikasi mati
func (p *EventPublisher) Close() error {
	return p.writer.Close()
}
