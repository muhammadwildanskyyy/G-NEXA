package kafka

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
	"github.com/sirupsen/logrus"
	"product-service/cmd/product/usecases"
	"product-service/infrastructure/logger"
	"product-service/model"
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

		logger.Debug(msgCtx, "infra:kafka", "receive new massage", logrus.Fields{
			"topic":     m.Topic,
			"partition": m.Partition,
			"offset":    m.Offset,
		})

		err = processFunc(msgCtx, m.Value)

		if err != nil {

			logger.Error(msgCtx, "infra:kafka", "Failed receive message", err, logrus.Fields{
				"offset": m.Offset,
			})
			continue
		}

		if err := c.reader.CommitMessages(ctx, m); err != nil {
			logger.Error(msgCtx, "infra:kafka", "Failed commit offset to broker", err, logrus.Fields{
				"offset": m.Offset,
			})
		} else {
			logger.Info(msgCtx, "infra:kafka", "Successfully processed & committed message", logrus.Fields{
				"offset": m.Offset,
			})
		}
	}
}

func HandlerConsumer(ctx context.Context, msg []byte, orderUsecase usecases.ProductUsecase) error {
	var payload model.OrderEventMessage[*model.OrderCreatedEventData]

	if err := json.Unmarshal(msg, &payload); err != nil {

		logger.Error(ctx, "handler:kafka", "Gagal parsing pesan, format JSON salah (Poison Pill diabaikan)", err, logrus.Fields{
			"payload": string(msg),
		})
		return nil
	}

	logFields := logrus.Fields{
		"event": payload.Event,
	}

	switch payload.Event {
	case "order.created":
		logger.Info(ctx, "handler:kafka", "recieve event created order, reduce product", logFields)

		err := orderUsecase.ReduceQuantityProduct(ctx, payload.Data.OrderItems)
		if err != nil {
			logger.Error(ctx, "handler:kafka", "Failed reduce quantity Product", err, logFields)
			return err
		}

		logger.Info(ctx, "handler:kafka", "quantity product succes reduce", logFields)
		return nil
	default:
		logger.Warn(ctx, "handler:kafka", "Menerima event yang tidak dikenal", logFields)
		return nil
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
