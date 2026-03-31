package grpc

import (
	"context"
	"finance/cmd/wallet/usecases"
	"finance/proto/financePb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type FinanceGrpcServer struct {
	financePb.UnimplementedFinanceServiceServer
	WalletUsecase  usecases.WalletUsecase
	PaymentUsecase usecases.PaymentUsecase
}

func NewFinanceGrpcServer(walletUsecase usecases.WalletUsecase, paymentUsecase usecases.PaymentUsecase) *FinanceGrpcServer {
	return &FinanceGrpcServer{
		WalletUsecase:  walletUsecase,
		PaymentUsecase: paymentUsecase,
	}
}

func (s *FinanceGrpcServer) GetWallet(ctx context.Context, req *financePb.WalletRequest) (*financePb.WalletResponse, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	wallet, err := s.WalletUsecase.GetWalletByUserID(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "wallet not found: %v", err)
	}

	availableBalance, _ := wallet.AvailableBalance.Float64()
	pendingBalance, _ := wallet.PendingBalance.Float64()

	return &financePb.WalletResponse{
		Id:               wallet.ID.String(),
		UserId:           wallet.UserID,
		AvailableBalance: availableBalance,
		PendingBalance:   pendingBalance,
		Currency:         wallet.Currency,
		Status:           wallet.Status,
		CreatedAt:        timestamppb.New(wallet.CreatedAt),
		UpdatedAt:        timestamppb.New(wallet.UpdatedAt),
	}, nil
}

func (s *FinanceGrpcServer) GetPayments(ctx context.Context, req *financePb.PaymentsRequest) (*financePb.PaymentsResponse, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	payments, err := s.PaymentUsecase.GetMyPayments(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get payments: %v", err)
	}

	var items []*financePb.PaymentItem
	for _, p := range payments {
		item := &financePb.PaymentItem{
			Id:                 p.ID.String(),
			UserId:             p.UserID,
			TransactionId:      p.TransactionID,
			TransactionType:    p.TransactionType,
			XenditPaymentReqId: p.XenditPaymentReqID,
			Amount:             p.Amount,
			Currency:           p.Currency,
			MethodType:         p.MethodType,
			ChannelCode:        p.ChannelCode,
			PaymentActionInfo:  p.PaymentActionInfo,
			Status:             p.Status,
			ExpiresAt:          timestamppb.New(p.ExpiresAt),
			CreatedAt:          timestamppb.New(p.CreatedAt),
			UpdatedAt:          timestamppb.New(p.UpdatedAt),
		}
		if p.PaidAt != nil {
			item.PaidAt = timestamppb.New(*p.PaidAt)
		}
		items = append(items, item)
	}

	return &financePb.PaymentsResponse{
		Payments: items,
	}, nil
}
