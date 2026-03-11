package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/xendit/xendit-go/v7"
	"github.com/xendit/xendit-go/v7/payment_request"

	"finance/infrastructure/logger"
	"finance/model"
)

type XenditRepository interface {
	CreatePaymentWithVA(ctx context.Context, param *model.CreateVAParam) (*model.PaymentResponse, error)
}

type xenditRepository struct {
	xenditClient *xendit.APIClient
}

func NewXenditRepository(xenditClient *xendit.APIClient) XenditRepository {
	return &xenditRepository{
		xenditClient: xenditClient,
	}
}

func (xr *xenditRepository) CreatePaymentWithVA(ctx context.Context, param *model.CreateVAParam) (*model.PaymentResponse, error) {
	expiredAt := time.Now().Add(time.Hour * 24)

	channelProps := payment_request.VirtualAccountChannelProperties{
		CustomerName: param.CustomerName,
		ExpiresAt:    &expiredAt,
	}

	vaParams := payment_request.VirtualAccountParameters{
		ChannelCode:       payment_request.VirtualAccountChannelCode(param.BankCode),
		ChannelProperties: channelProps,
	}

	nullableVA := *payment_request.NewNullableVirtualAccountParameters(&vaParams)

	pmParams := payment_request.PaymentMethodParameters{
		Type:           payment_request.PAYMENTMETHODTYPE_VIRTUAL_ACCOUNT,
		Reusability:    payment_request.PAYMENTMETHODREUSABILITY_ONE_TIME_USE,
		ReferenceId:    &param.TransactionID,
		VirtualAccount: nullableVA,
	}

	req := payment_request.PaymentRequestParameters{
		ReferenceId:   &param.TransactionID,
		Amount:        &param.Amount,
		Currency:      payment_request.PAYMENTREQUESTCURRENCY_IDR,
		PaymentMethod: &pmParams,
		Metadata: map[string]interface{}{
			"customer_name": param.CustomerName,
			"user_id":       param.UserID,
		},
	}

	req.SetDescription(param.Description)

	resp, _, sdkErr := xr.xenditClient.PaymentRequestApi.CreatePaymentRequest(ctx).
		IdempotencyKey(param.IdempotencyKey).
		PaymentRequestParameters(req).
		Execute()

	if sdkErr != nil {
		logger.Error(ctx, "repository:xendit", "Failed to create VA payment request via Xendit SDK", sdkErr, logrus.Fields{
			"transaction_id": param.TransactionID,
			"bank_code":      param.BankCode,
		})
		return nil, errors.New("failed to create virtual account payment request")
	}

	var vaNumber string

	if resp.PaymentMethod.VirtualAccount.IsSet() {
		vaProps := resp.PaymentMethod.VirtualAccount.Get().ChannelProperties
		if vaProps.VirtualAccountNumber != nil {
			vaNumber = *vaProps.VirtualAccountNumber
		}
	}

	logger.Debug(ctx, "repository:xendit", "Successfully created VA payment request", logrus.Fields{
		"transaction_id": param.TransactionID,
		"va_number":      vaNumber,
		"bank_code":      param.BankCode,
	})

	return &model.PaymentResponse{
		PaymentID:     resp.Id,
		TransactionID: resp.ReferenceId,
		Status:        string(resp.Status),
		VANumber:      vaNumber,
		BankCode:      param.BankCode,
		ExpiresAt:     expiredAt,
		FinalAmount:   *resp.Amount,
	}, nil
}
