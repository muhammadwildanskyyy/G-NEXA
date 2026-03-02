package kafka

import (
	"context"
	"encoding/json"
	"product-service/infrastructure/logger"

	"github.com/segmentio/kafka-go"
	"github.com/sirupsen/logrus"
)

// EventPublisher membungkus kafka.Writer
type EventPublisher struct {
	writer *kafka.Writer
}

func NewEventPublisher(brokers []string, topic string) *EventPublisher {
	w := &kafka.Writer{
		Addr:  kafka.TCP(brokers...),
		Topic: topic,

		Balancer: &kafka.Hash{},

		RequiredAcks: kafka.RequireAll,
		MaxAttempts:  5,
	}

	return &EventPublisher{writer: w}
}

func (p *EventPublisher) Publish(ctx context.Context, key string, payload interface{}) error {
	bytes, err := json.Marshal(payload)
	if err != nil {
		logger.Error(ctx, "infra:kafka-producer", "Failed to marshal payload to JSON", err, logrus.Fields{
			"key": key,
		})
		return err
	}

	var headers []kafka.Header

	if traceID, ok := ctx.Value("trace_id").(string); ok && traceID != "" {
		headers = append(headers, kafka.Header{
			Key:   "X-Correlation-ID",
			Value: []byte(traceID),
		})
	}

	if userID, ok := ctx.Value("user_id").(string); ok && userID != "" {
		headers = append(headers, kafka.Header{
			Key:   "X-User-ID",
			Value: []byte(userID),
		})
	}

	msg := kafka.Message{
		Key:     []byte(key),
		Value:   bytes,
		Headers: headers,
	}

	logger.Debug(ctx, "infra:kafka-producer", "Publishing event to Kafka...", logrus.Fields{
		"topic": p.writer.Topic,
		"key":   key,
	})

	err = p.writer.WriteMessages(ctx, msg)
	if err != nil {
		logger.Error(ctx, "infra:kafka-producer", "Gagal mempublish event ke Kafka", err, logrus.Fields{
			"topic": p.writer.Topic,
			"key":   key,
		})
		return err
	}

	logger.Info(ctx, "infra:kafka-producer", "Sukses mempublish event ke Kafka", logrus.Fields{
		"topic": p.writer.Topic,
		"key":   key,
	})

	return nil
}

func (p *EventPublisher) Close() error {
	return p.writer.Close()
}
