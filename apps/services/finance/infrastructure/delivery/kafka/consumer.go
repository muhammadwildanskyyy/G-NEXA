package kafka

import (
	"context"
	"encoding/json"
	"finance/cmd/wallet/usecases"
	"finance/model"
	"log"

	"github.com/segmentio/kafka-go"
)

type Consumer struct {
	reader *kafka.Reader
}

func NewConsumer(brokers []string, topic, groupID string) *Consumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		GroupID:  groupID,
		Topic:    topic,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
		// PENTING: Matikan interval commit otomatis
		CommitInterval: 0,
	})

	return &Consumer{reader: r}
}

func (c *Consumer) Start(ctx context.Context, processFunc func(ctx context.Context, msg []byte) error) {
	log.Println("Memulai Kafka Consumer...")

	for {
		// 1. FETCH MESSAGE (Ambil pesan tanpa memindahkan offset/commit)
		m, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				log.Println("Consumer dihentikan secara graceful")
				break
			}
			log.Printf("Error fetching message: %v", err)
			continue
		}

		// 2. PROCESS MESSAGE (Panggil Usecase / Logic Bisnis)
		err = processFunc(ctx, m.Value)

		if err != nil {
			// Jika gagal (misal DB down atau Optimistic Lock gagal),
			// KITA JANGAN COMMIT. Biarkan pesan ini di-retry lagi nanti.
			log.Printf("Gagal memproses pesan (Offset: %d): %v", m.Offset, err)

			// Opsi Lanjutan: Kirim ke Dead Letter Queue (DLQ) jika error-nya unrecoverable (misal JSON cacat)
			continue
		}

		// 3. MANUAL COMMIT (Hanya jika proses bisnis berhasil 100%)
		if err := c.reader.CommitMessages(ctx, m); err != nil {
			log.Printf("Gagal melakukan commit offset: %v", err)
		} else {
			log.Printf("Sukses memproses & commit pesan. Offset: %d", m.Offset)
		}
	}
}

func HandlerConsumer(c context.Context, msg []byte, walletUseCase usecases.WalletUsecase) error {
	var payload model.UserEventMessage

	if err := json.Unmarshal(msg, &payload); err != nil {
		log.Printf("[Kafka] Gagal parsing pesan, format JSON salah: %v\n", err)
		return nil
	}

	switch payload.Event {
	case "user.created":
		wallet, err := walletUseCase.CreateWallet(c, payload.Data.UserID)
		log.Println(wallet)
		if err != nil {
			return err
		}

		return nil

	case "user.deleted":

		log.Printf("[Kafka] Mengabaikan event user.deleted...\n")
		return nil

	default:

		return nil
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
