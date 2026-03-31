package grpcclient

import (
	"context"
	"product-service/infrastructure/logger"
	"product-service/proto/userPb"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type UserGrpcClient struct {
	conn   *grpc.ClientConn
	client userPb.UserServiceClient
}

func NewUserGrpcClient(grpcUrl string) (*UserGrpcClient, error) {
	ctx := context.Background()

	if grpcUrl == "" {
		grpcUrl = "user-service:50052"
	}

	conn, err := grpc.NewClient(grpcUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Error(ctx, "infra:user-grpc", "Failed to connect to User gRPC service", err, logrus.Fields{
			"grpc_url": grpcUrl,
		})
		return nil, err
	}

	client := userPb.NewUserServiceClient(conn)

	logger.Info(ctx, "infra:user-grpc", "Connected to User gRPC service", logrus.Fields{
		"grpc_url": grpcUrl,
	})

	return &UserGrpcClient{
		conn:   conn,
		client: client,
	}, nil
}

func (c *UserGrpcClient) GetStoreById(ctx context.Context, storeId string) (*userPb.StoreResponse, error) {
	resp, err := c.client.GetStoreById(ctx, &userPb.StoreRequest{
		StoreId: storeId,
	})
	if err != nil {
		logger.Error(ctx, "infra:user-grpc", "gRPC GetStoreById failed", err, logrus.Fields{
			"store_id": storeId,
		})
		return nil, err
	}
	return resp, nil
}

func (c *UserGrpcClient) GetStoreByOwner(ctx context.Context, ownerId string) (*userPb.StoreResponse, error) {
	resp, err := c.client.GetStoreByOwner(ctx, &userPb.StoreByOwnerRequest{
		OwnerId: ownerId,
	})
	if err != nil {
		logger.Error(ctx, "infra:user-grpc", "gRPC GetStoreByOwner failed", err, logrus.Fields{
			"owner_id": ownerId,
		})
		return nil, err
	}
	return resp, nil
}

func (c *UserGrpcClient) GetUser(ctx context.Context, userId string) (*userPb.UserResponse, error) {
	resp, err := c.client.GetUser(ctx, &userPb.UserRequest{
		UserId: userId,
	})
	if err != nil {
		logger.Error(ctx, "infra:user-grpc", "gRPC GetUser failed", err, logrus.Fields{
			"user_id": userId,
		})
		return nil, err
	}
	return resp, nil
}

func (c *UserGrpcClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
