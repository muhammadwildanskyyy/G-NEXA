package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"product-service/cmd/product/repositories"
	"product-service/config"
	grpcclient "product-service/infrastructure/grpc-client"
	"product-service/infrastructure/logger"
	"product-service/model"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProductService interface {
	CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error)
	UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error)
	DeleteProduct(ctx context.Context, productId string) error
	GetProductById(ctx context.Context, productId string) (*model.Product, error)
	GetProducts(ctx context.Context, paginationParam *model.ProductQueryParam) (*model.PaginationProductResult, error)
	GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error)
	CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error)
	ReduceQuantityProduct(ctx context.Context, product *model.Product, reduceStoct int) error
	RestoreQuantityProduct(ctx context.Context, product *model.Product, quantity int) error
}

type productService struct {
	ProductRepository  repositories.ProductRepository
	CategoryRepository repositories.CategoryRepository
	HostServices       config.HostServices
	UserGrpcClient     *grpcclient.UserGrpcClient
}

func NewProductService(productRepository repositories.ProductRepository, categoryRepository repositories.CategoryRepository, HostServices config.HostServices, userGrpcClient *grpcclient.UserGrpcClient) ProductService {
	return &productService{
		ProductRepository:  productRepository,
		CategoryRepository: categoryRepository,
		HostServices:       HostServices,
		UserGrpcClient:     userGrpcClient,
	}
}

func (ps *productService) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {
	// 1. gRPC Call to User-Service to verify Store
	logger.Info(ctx, "infra:user-service", "Fetching store data via gRPC", logrus.Fields{"store_id": product.StoreID})

	store, err := ps.UserGrpcClient.GetStoreById(ctx, product.StoreID)
	if err != nil {
		logger.Error(ctx, "infra:user-service", "gRPC GetStoreById failed", err, nil)
		return nil, fmt.Errorf("failed to verify store: %v", err)
	}

	// 2. Category & Specs Validation
	category, err := ps.CategoryRepository.SelectCategoryById(ctx, product.CategoryID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "service:product", "Product creation denied: Category not found", logrus.Fields{"category_id": product.CategoryID})
		}
		return nil, err
	}

	if err := ps.validateProductSpecs(ctx, category, product.Specs); err != nil {
		logger.Warn(ctx, "service:product", "Product creation denied: Specs validation failed", logrus.Fields{"error": err.Error()})
		return nil, err
	}

	categoryId, _ := primitive.ObjectIDFromHex(product.CategoryID)
	productInput := &model.Product{
		StoreID:     store.Id,
		CategoryID:  &categoryId,
		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,
		Price:       product.Price,
		Stock:       product.Stock,
		IsActive:    product.IsActive,
		Weight:      product.Weight,
		Dimensions:  product.Dimensions,
		Images:      product.Images,
		Thumbnail:   product.Thumbnail,
		Specs:       product.Specs,
		Tags:        product.Tags,
	}

	newProduct, err := ps.ProductRepository.InsertProduct(ctx, productInput)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:product", "Product successfully created", logrus.Fields{"product_id": newProduct.ID})
	return newProduct, nil
}

func (ps *productService) UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
	categoryId, err := primitive.ObjectIDFromHex(product.CategoryID)
	if err != nil {
		logger.Warn(ctx, "service:product", "Product update denied: Invalid category ID", logrus.Fields{"category_id": product.CategoryID})
		return nil, err
	}

	productInput := &model.Product{
		StoreID:     product.StoreID,
		CategoryID:  &categoryId,
		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,
		Price:       product.Price,
		Stock:       product.Stock,
		IsActive:    product.IsActive,
		Weight:      product.Weight,
		Dimensions:  product.Dimensions,
		Images:      product.Images,
		Thumbnail:   product.Thumbnail,
		Specs:       product.Specs,
		Tags:        product.Tags,
	}

	newProduct, err := ps.ProductRepository.UpdateProduct(ctx, productInput, productId)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:product", "Product successfully updated", logrus.Fields{"product_id": productId})
	return newProduct, nil
}

func (ps *productService) DeleteProduct(ctx context.Context, productId string) error {
	err := ps.ProductRepository.DeleteProduct(ctx, productId)
	if err != nil {
		return err
	}

	logger.Info(ctx, "service:product", "Product successfully deleted", logrus.Fields{"product_id": productId})
	return nil
}

func (ps *productService) GetProductById(ctx context.Context, productId string) (*model.Product, error) {
	product, err := ps.ProductRepository.FindProductByID(ctx, productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "service:product", "Product retrieval failed: Not found", logrus.Fields{"product_id": productId})
		}
		return nil, err
	}
	return product, nil
}

func (ps *productService) GetProducts(ctx context.Context, params *model.ProductQueryParam) (*model.PaginationProductResult, error) {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 10
	}

	products, totalProduct, err := ps.ProductRepository.FindAllProducts(ctx, params)
	if err != nil {
		return nil, err
	}

	totalPages := int64(math.Ceil(float64(totalProduct) / float64(params.Limit)))
	return &model.PaginationProductResult{
		Products:  products,
		TotalData: totalProduct,
		TotalPage: totalPages,
		Page:      params.Page,
		Limit:     params.Limit,
	}, nil
}

func (ps *productService) GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
	result, err := ps.ProductRepository.SelectProductsByCategoryId(ctx, categoryId)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (ps *productService) validateProductSpecs(ctx context.Context, category *model.Category, inputSpecs map[string]interface{}) error {
	for _, template := range category.Templates {
		value, exists := inputSpecs[template.Key]

		if template.Required {
			if !exists || value == nil || value == "" {
				return fmt.Errorf("specification field '%s' is required", template.Label)
			}
		}

		if !exists || value == nil {
			continue
		}

		if template.Type == "dropdown" && len(template.Options) > 0 {
			isValidOption := false
			inputString := fmt.Sprintf("%v", value)

			for _, option := range template.Options {
				if option == inputString {
					isValidOption = true
					break
				}
			}

			if !isValidOption {
				return fmt.Errorf("value '%s' is invalid for field '%s'. Options: %v", inputString, template.Label, template.Options)
			}
		}
	}
	return nil
}

func (ps *productService) CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error) {
	var successProducts []*model.Product
	var failedCount int

	logger.Info(ctx, "service:product", "Starting bulk product creation", logrus.Fields{"total_items": len(products)})

	for _, req := range products {
		newProduct, err := ps.CreateProduct(ctx, req)
		if err != nil {
			failedCount++
			continue
		}
		successProducts = append(successProducts, newProduct)
	}

	logger.Info(ctx, "service:product", "Bulk product creation completed", logrus.Fields{
		"success": len(successProducts),
		"failed":  failedCount,
	})

	return successProducts, nil
}

func (ps *productService) ReduceQuantityProduct(ctx context.Context, product *model.Product, reduceStoct int) error {

	product.Stock = product.Stock - reduceStoct
	idString := product.ID.Hex()
	_, err := ps.ProductRepository.UpdateProduct(ctx, product, idString)
	if err != nil {
		logger.Error(ctx, "service:product", "Failed Reduce Quantity of Product", err, logrus.Fields{"product_id": idString})
		return err
	}
	return nil
}

func (ps *productService) RestoreQuantityProduct(ctx context.Context, product *model.Product, quantity int) error {
	product.Stock = product.Stock + quantity
	idString := product.ID.Hex()
	_, err := ps.ProductRepository.UpdateProduct(ctx, product, idString)
	if err != nil {
		logger.Error(ctx, "service:product", "Failed to restore quantity of product", err, logrus.Fields{"product_id": idString})
		return err
	}

	logger.Info(ctx, "service:product", "Product stock restored successfully", logrus.Fields{
		"product_id":   idString,
		"restored_qty": quantity,
		"new_stock":    product.Stock,
	})
	return nil
}
