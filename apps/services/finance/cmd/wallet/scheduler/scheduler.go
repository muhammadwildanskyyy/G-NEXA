package scheduler

import (
	"context"
	"time"

	"finance/cmd/wallet/usecases"
	"finance/infrastructure/logger"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type SchedulerService interface {
	Start(ctx context.Context)
}

type schedulerService struct {
	xenditUsecase  usecases.XenditUsecase
	paymentUsecase usecases.PaymentUsecase
	walletUsecase  usecases.WalletUsecase
}

func NewSchedulerService(
	xenditUsecase usecases.XenditUsecase,
	paymentUsecase usecases.PaymentUsecase,
	walletUsecase usecases.WalletUsecase,
) SchedulerService {
	return &schedulerService{
		xenditUsecase:  xenditUsecase,
		paymentUsecase: paymentUsecase,
		walletUsecase:  walletUsecase,
	}
}

func (s *schedulerService) Start(ctx context.Context) {
	paymentSyncInterval := 5 * time.Minute
	expiryGuardInterval := 1 * time.Minute
	reconciliationInterval := 24 * time.Hour

	logger.Info(ctx, "service:scheduler", "Scheduler started with cronjobs", logrus.Fields{
		"payment_sync_interval":   paymentSyncInterval.String(),
		"expiry_guard_interval":   expiryGuardInterval.String(),
		"reconciliation_interval": reconciliationInterval.String(),
	})

	paymentSyncTicker := time.NewTicker(paymentSyncInterval)
	expiryGuardTicker := time.NewTicker(expiryGuardInterval)
	reconciliationTicker := time.NewTicker(reconciliationInterval)

	defer paymentSyncTicker.Stop()
	defer expiryGuardTicker.Stop()
	defer reconciliationTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info(ctx, "service:scheduler", "Scheduler stopped (context cancelled)", nil)
			return

		case <-paymentSyncTicker.C:
			traceID := uuid.New().String()
			jobCtx := context.WithValue(ctx, "trace_id", traceID)

			logger.Info(jobCtx, "service:scheduler", "Running Payment Status Sync...", nil)

			err := s.xenditUsecase.SyncPendingPayments(jobCtx)
			if err != nil {
				logger.Error(jobCtx, "service:scheduler", "Payment Status Sync failed", err, nil)
			} else {
				logger.Info(jobCtx, "service:scheduler", "Payment Status Sync completed", nil)
			}

		case <-expiryGuardTicker.C:
			traceID := uuid.New().String()
			jobCtx := context.WithValue(ctx, "trace_id", traceID)

			logger.Info(jobCtx, "service:scheduler", "Running Expiry Guard...", nil)

			err := s.paymentUsecase.ExpireOldPayments(jobCtx)
			if err != nil {
				logger.Error(jobCtx, "service:scheduler", "Expiry Guard failed", err, nil)
			} else {
				logger.Info(jobCtx, "service:scheduler", "Expiry Guard completed", nil)
			}

		case <-reconciliationTicker.C:
			traceID := uuid.New().String()
			jobCtx := context.WithValue(ctx, "trace_id", traceID)

			logger.Info(jobCtx, "service:scheduler", "Running Balance Reconciliation...", nil)

			err := s.walletUsecase.ReconcileBalances(jobCtx)
			if err != nil {
				logger.Error(jobCtx, "service:scheduler", "Balance Reconciliation failed", err, nil)
			} else {
				logger.Info(jobCtx, "service:scheduler", "Balance Reconciliation completed", nil)
			}
		}
	}
}
