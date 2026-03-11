package services

import (
	"context"
	"encoding/json"

	"github.com/sirupsen/logrus"

	"finance/cmd/wallet/repositories"
	"finance/infrastructure/logger"
	"finance/model"
)

type AnomalyService interface {
	RecordAnomaly(ctx context.Context, anomalyType, severity, source, transactionID, userID, description string, metadata map[string]interface{})
}

type anomalyService struct {
	anomalyRepository repositories.AnomalyRepository
}

func NewAnomalyService(anomalyRepository repositories.AnomalyRepository) AnomalyService {
	return &anomalyService{anomalyRepository: anomalyRepository}
}

func (s *anomalyService) RecordAnomaly(ctx context.Context, anomalyType, severity, source, transactionID, userID, description string, metadata map[string]interface{}) {
	// Encode metadata to JSON string
	metadataJSON := "{}"
	if metadata != nil {
		if bytes, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(bytes)
		}
	}

	anomaly := &model.PaymentAnomaly{
		TransactionID: transactionID,
		UserID:        userID,
		AnomalyType:   anomalyType,
		Severity:      severity,
		Description:   description,
		Metadata:      metadataJSON,
		Source:        source,
	}

	// Log the anomaly with appropriate level
	logFields := logrus.Fields{
		"anomaly_type":   anomalyType,
		"severity":       severity,
		"source":         source,
		"transaction_id": transactionID,
		"user_id":        userID,
	}

	switch severity {
	case model.SEVERITY_CRITICAL:
		logger.Error(ctx, "service:anomaly", "🚨 PAYMENT ANOMALY DETECTED: "+description, nil, logFields)
	case model.SEVERITY_WARNING:
		logger.Warn(ctx, "service:anomaly", "⚠️ PAYMENT ANOMALY: "+description, logFields)
	default:
		logger.Info(ctx, "service:anomaly", "PAYMENT ANOMALY: "+description, logFields)
	}

	// Save to database (fire-and-forget, should not block main flow)
	err := s.anomalyRepository.SaveAnomaly(ctx, anomaly)
	if err != nil {
		logger.Error(ctx, "service:anomaly", "Failed to persist anomaly record to database", err, logFields)
	}
}
