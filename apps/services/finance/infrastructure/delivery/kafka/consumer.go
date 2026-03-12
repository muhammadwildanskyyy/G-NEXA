package kafka

import (
	"context"
	"encoding/json"

	"finance/cmd/wallet/usecases"
	"finance/infrastructure/logger"
	"finance/model"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
	"github.com/sirupsen/logrus"
)

type Consumer struct {
	reader *kafka.Reader
}

func NewConsumer(brokers []string, topic, groupID string) *Consumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        brokers,
		GroupID:        groupID,
		Topic:          topic,
		MinBytes:       10e3,
		MaxBytes:       10e6,
		CommitInterval: 0,
	})

	return &Consumer{reader: r}
}

func (c *Consumer) Start(ctx context.Context, processFunc func(ctx context.Context, msg []byte) error) {
	logger.Info(ctx, "infra:kafka", "Memulai Kafka Consumer...", nil)

	for {

		m, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				logger.Warn(ctx, "infra:kafka", "Consumer dihentikan secara graceful", nil)
				break
			}
			logger.Error(ctx, "infra:kafka", "Error fetching message", err, nil)
			continue
		}

		var traceID string
		for _, header := range m.Headers {
			if header.Key == "X-Correlation-ID" {
				traceID = string(header.Value)
				break
			}
		}

		if traceID == "" {
			traceID = uuid.New().String()
		}

		msgCtx := context.WithValue(ctx, "trace_id", traceID)

		logger.Debug(msgCtx, "infra:kafka", "Menerima pesan baru", logrus.Fields{
			"topic":     m.Topic,
			"partition": m.Partition,
			"offset":    m.Offset,
		})

		err = processFunc(msgCtx, m.Value)

		if err != nil {

			logger.Error(msgCtx, "infra:kafka", "Gagal memproses pesan (offset tidak di-commit)", err, logrus.Fields{
				"offset": m.Offset,
			})
			continue
		}

		if err := c.reader.CommitMessages(ctx, m); err != nil {
			logger.Error(msgCtx, "infra:kafka", "Gagal melakukan commit offset ke broker", err, logrus.Fields{
				"offset": m.Offset,
			})
		} else {
			logger.Info(msgCtx, "infra:kafka", "Sukses memproses & commit pesan", logrus.Fields{
				"offset": m.Offset,
			})
		}
	}
}

func HandlerConsumer(ctx context.Context, msg []byte, walletUseCase usecases.WalletUsecase) error {
	var payload model.UserEventMessage

	if err := json.Unmarshal(msg, &payload); err != nil {

		logger.Error(ctx, "handler:kafka", "Gagal parsing pesan, format JSON salah (Poison Pill diabaikan)", err, logrus.Fields{
			"payload": string(msg),
		})
		return nil
	}

	ctx = context.WithValue(ctx, "user_id", payload.Data.UserID)

	logFields := logrus.Fields{
		"event":   payload.Event,
		"user_id": payload.Data.UserID,
	}

	switch payload.Event {
	case "user.created":
		logger.Info(ctx, "handler:kafka", "Menerima event pembuatan user, memproses wallet...", logFields)

		wallet, err := walletUseCase.CreateWallet(ctx, payload.Data.UserID)
		if err != nil {
			logger.Error(ctx, "handler:kafka", "Gagal membuat wallet untuk user", err, logFields)
			return err
		}

		logger.Info(ctx, "handler:kafka", "Wallet berhasil dibuat", logrus.Fields{
			"wallet_id": wallet.ID,
		})
		return nil

	case "user.deleted":
		logger.Debug(ctx, "handler:kafka", "Mengabaikan event user.deleted", logFields)
		return nil

	default:
		logger.Warn(ctx, "handler:kafka", "Menerima event yang tidak dikenal", logFields)
		return nil
	}
}

func HandlerOrderConsumer(ctx context.Context, msg []byte, paymentUsecase usecases.PaymentUsecase) error {
	var payload model.InvoiceCreatedEvent

	if err := json.Unmarshal(msg, &payload); err != nil {
		logger.Error(ctx, "handler:kafka:order", "Failed to parse order event message (Poison Pill ignored)", err, logrus.Fields{
			"payload": string(msg),
		})
		return nil
	}

	ctx = context.WithValue(ctx, "user_id", payload.Data.UserID)

	logFields := logrus.Fields{
		"event":      payload.Event,
		"invoice_id": payload.Data.InvoiceID,
		"user_id":    payload.Data.UserID,
	}

	switch payload.Event {
	case "invoice.created":
		logger.Info(ctx, "handler:kafka:order", "Received invoice.created event, initiating payment creation...", logFields)

		err := paymentUsecase.CreateOrderPayment(ctx, payload.Data)
		if err != nil {
			logger.Error(ctx, "handler:kafka:order", "Failed to create order payment from invoice event", err, logFields)
			return err
		}

		logger.Info(ctx, "handler:kafka:order", "Order payment created successfully from invoice event", logFields)
		return nil

	default:
		logger.Warn(ctx, "handler:kafka:order", "Received unknown order event", logFields)
		return nil
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
