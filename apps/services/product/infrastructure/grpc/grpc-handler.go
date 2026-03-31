package grpc

import (
	"context"
	"product-service/cmd/product/usecases"
	"product-service/proto/productPb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type ProductGrpcServer struct {
	productPb.UnimplementedProductServiceServer
	ProductUsecase usecases.ProductUsecase
}

func NewProductGrpcServer(productUsecase usecases.ProductUsecase) *ProductGrpcServer {
	return &ProductGrpcServer{
		ProductUsecase: productUsecase,
	}
}

func (s *ProductGrpcServer) GetProduct(ctx context.Context, req *productPb.ProductRequest) (*productPb.ProductResponse, error) {
	if req.GetId() == "" {
		return nil, status.Error(codes.InvalidArgument, "product id is required")
	}

	product, err := s.ProductUsecase.GetProductByID(ctx, req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "product not found: %v", err)
	}

	// Convert specs map to protobuf Struct
	var protoSpecs *structpb.Struct
	if product.Specs != nil {
		protoSpecs, err = structpb.NewStruct(product.Specs)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to convert specs: %v", err)
		}
	}

	return &productPb.ProductResponse{
		Id:          product.ID.Hex(),
		StoreId:     product.StoreID,
		CategoryId:  product.CategoryID.Hex(),
		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,
		Price:       product.Price,
		Stock:       int32(product.Stock),
		IsActive:    product.IsActive,
		Weight:      int32(product.Weight),
		Dimensions: &productPb.Dimensions{
			Length: int32(product.Dimensions.Length),
			Width:  int32(product.Dimensions.Width),
			Height: int32(product.Dimensions.Height),
		},
		Images:    product.Images,
		Thumbnail: product.Thumbnail,
		Specs:     protoSpecs,
		Tags:      product.Tags,
		Views:     product.Views,
		Rating:    product.Rating,
		CreatedAt: timestamppb.New(product.CreatedAt),
		UpdatedAt: timestamppb.New(product.UpdatedAt),
	}, nil
}
