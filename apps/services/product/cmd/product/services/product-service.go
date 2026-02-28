package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"product-service/cmd/product/repositories"
	"product-service/config"
	"product-service/infrastructure/logger"
	"product-service/model"
	"time"

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
}

type productService struct {
	ProductRepository  repositories.ProductRepository
	CategoryRepository repositories.CategoryRepository
	HostServices       config.HostServices
}

func NewProductService(productRepository repositories.ProductRepository, categoryRepository repositories.CategoryRepository, HostServices config.HostServices) ProductService {
	return &productService{
		ProductRepository:  productRepository,
		CategoryRepository: categoryRepository,
		HostServices:       HostServices,
	}
}

func (p *productService) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {
	// 1. External Service Call (User-Service to verify Store)
	httpClient := &http.Client{Timeout: time.Second * 10}
	targetURL := fmt.Sprintf("http://user-service:8081/v1/api/store/%v", product.StoreID)

	logger.Info(ctx, "infra:user-service", "Fetching store data from upstream", logrus.Fields{"store_id": product.StoreID})

	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		return nil, err
	}

	accessToken, ok := ctx.Value("access_token").(string)
	if !ok {
		logger.Warn(ctx, "service:product", "Product creation denied: Access token missing", nil)
		return nil, errors.New("access token missing from header")
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		logger.Error(ctx, "infra:user-service", "Upstream request failed", err, nil)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Warn(ctx, "infra:user-service", "Upstream returned non-OK status", logrus.Fields{"status": resp.StatusCode})
		return nil, fmt.Errorf("upstream API returned status: %d", resp.StatusCode)
	}

	var response model.APIResponseStore
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}
	store := response.Data

	// 2. Category & Specs Validation
	category, err := p.CategoryRepository.SelectCategoryById(ctx, product.CategoryID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "service:product", "Product creation denied: Category not found", logrus.Fields{"category_id": product.CategoryID})
		}
		return nil, err
	}

	if err := p.validateProductSpecs(ctx, category, product.Specs); err != nil {
		logger.Warn(ctx, "service:product", "Product creation denied: Specs validation failed", logrus.Fields{"error": err.Error()})
		return nil, err
	}

	categoryId, _ := primitive.ObjectIDFromHex(product.CategoryID)
	productInput := &model.Product{
		StoreID:     store.ID,
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

	newProduct, err := p.ProductRepository.InsertProduct(ctx, productInput)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:product", "Product successfully created", logrus.Fields{"product_id": newProduct.ID})
	return newProduct, nil
}

func (p *productService) UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
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

	newProduct, err := p.ProductRepository.UpdateProduct(ctx, productInput, productId)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:product", "Product successfully updated", logrus.Fields{"product_id": productId})
	return newProduct, nil
}

func (p *productService) DeleteProduct(ctx context.Context, productId string) error {
	err := p.ProductRepository.DeleteProduct(ctx, productId)
	if err != nil {
		return err
	}

	logger.Info(ctx, "service:product", "Product successfully deleted", logrus.Fields{"product_id": productId})
	return nil
}

func (p *productService) GetProductById(ctx context.Context, productId string) (*model.Product, error) {
	product, err := p.ProductRepository.FindProductByID(ctx, productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "service:product", "Product retrieval failed: Not found", logrus.Fields{"product_id": productId})
		}
		return nil, err
	}
	return product, nil
}

func (p *productService) GetProducts(ctx context.Context, params *model.ProductQueryParam) (*model.PaginationProductResult, error) {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 10
	}

	products, totalProduct, err := p.ProductRepository.FindAllProducts(ctx, params)
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

func (p *productService) GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
	result, err := p.ProductRepository.SelectProductsByCategoryId(ctx, categoryId)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (p *productService) validateProductSpecs(ctx context.Context, category *model.Category, inputSpecs map[string]interface{}) error {
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

func (s *productService) CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error) {
	var successProducts []*model.Product
	var failedCount int

	logger.Info(ctx, "service:product", "Starting bulk product creation", logrus.Fields{"total_items": len(products)})

	for _, req := range products {
		newProduct, err := s.CreateProduct(ctx, req)
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
