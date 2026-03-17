package usecases

import (
	"context"
	"encoding/json"
	"product-service/cmd/product/services"
	"product-service/infrastructure/logger"
	"product-service/model"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type ProductUsecase interface {
	CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error)
	GetProductByID(ctx context.Context, id string) (*model.Product, error)
	GetProducts(ctx context.Context, paramPagination *model.ProductQueryParam) (*model.PaginationProductResult, error)
	UpodateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error)
	DeleteProduct(ctx context.Context, id string) error
	SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error)
	CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error)
	ReduceQuantityProduct(ctx context.Context, params []*model.OrderItem) error
	RestoreQuantityProduct(ctx context.Context, params []*model.OrderItem) error
}

type productUsecase struct {
	ProductService services.ProductService
	Redis          *redis.Client
}

func NewProductUsecase(productService services.ProductService, redis *redis.Client) ProductUsecase {
	return &productUsecase{
		ProductService: productService,
		Redis:          redis,
	}
}

func (pu *productUsecase) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {
	result, err := pu.ProductService.CreateProduct(ctx, product)
	if err != nil {
		return nil, err
	}

	// Invalidate cache
	if pu.Redis != nil {
		pu.Redis.Del(ctx, "products:all")
	}

	logger.Info(ctx, "usecase:product", "Product creation orchestrated successfully", logrus.Fields{
		"product_name": product.Name,
	})
	return result, nil
}

func (pu *productUsecase) GetProductByID(ctx context.Context, id string) (*model.Product, error) {
	cacheKey := "product:" + id
	if pu.Redis != nil {
		var cachedProduct model.Product
		val, err := pu.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			if err := json.Unmarshal([]byte(val), &cachedProduct); err == nil {
				return &cachedProduct, nil
			}
		}
	}

	result, err := pu.ProductService.GetProductById(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache result
	if pu.Redis != nil {
		data, _ := json.Marshal(result)
		pu.Redis.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	// Silent success for read operations
	return result, nil
}

func (pu *productUsecase) GetProducts(ctx context.Context, params *model.ProductQueryParam) (*model.PaginationProductResult, error) {
	cacheKey := "products:all"
	// Only cache if no specific filters are applied to keep it simple for now
	isDefault := params == nil || (params.Page <= 1 && params.Limit <= 10 && params.Search == "" && params.CategoryID == "" && params.StoreID == "" && params.Condition == "" && params.MinPrice == 0 && params.MaxPrice == 0 && params.SortBy == "")

	if isDefault && pu.Redis != nil {
		var cachedResult model.PaginationProductResult
		val, err := pu.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			if err := json.Unmarshal([]byte(val), &cachedResult); err == nil {
				return &cachedResult, nil
			}
		}
	}

	result, err := pu.ProductService.GetProducts(ctx, params)
	if err != nil {
		return nil, err
	}

	// Cache result if it's the default view
	if isDefault && pu.Redis != nil {
		data, _ := json.Marshal(result)
		pu.Redis.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	// Silent success for read operations
	return result, nil
}

func (pu *productUsecase) UpodateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
	result, err := pu.ProductService.UpdateProduct(ctx, product, productId)
	if err != nil {
		return nil, err
	}

	// Invalidate cache
	if pu.Redis != nil {
		pu.Redis.Del(ctx, "product:"+productId, "products:all")
	}

	logger.Info(ctx, "usecase:product", "Product update orchestrated successfully", logrus.Fields{
		"product_id": productId,
	})
	return result, nil
}

func (pu *productUsecase) DeleteProduct(ctx context.Context, id string) error {
	err := pu.ProductService.DeleteProduct(ctx, id)
	if err != nil {
		return err
	}

	// Invalidate cache
	if pu.Redis != nil {
		pu.Redis.Del(ctx, "product:"+id, "products:all")
	}

	logger.Info(ctx, "usecase:product", "Product deletion orchestrated successfully", logrus.Fields{
		"product_id": id,
	})
	return nil
}

func (pu *productUsecase) SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
	cacheKey := "products:by-category:" + categoryId
	if pu.Redis != nil {
		var cachedProducts []*model.Product
		val, err := pu.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			if err := json.Unmarshal([]byte(val), &cachedProducts); err == nil {
				return cachedProducts, nil
			}
		}
	}

	result, err := pu.ProductService.GetProductsByCategoryId(ctx, categoryId)
	if err != nil {
		return nil, err
	}

	// Cache result
	if pu.Redis != nil {
		data, _ := json.Marshal(result)
		pu.Redis.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	// Silent success for read operations
	return result, nil
}

func (pu *productUsecase) CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error) {
	result, err := pu.ProductService.CreateProductBulk(ctx, products)
	if err != nil {
		return nil, err
	}

	// Invalidate cache
	if pu.Redis != nil {
		pu.Redis.Del(ctx, "products:all")
	}

	logger.Info(ctx, "usecase:product", "Bulk product creation orchestrated successfully", logrus.Fields{
		"total_processed": len(result),
	})
	return result, nil
}

func (pu *productUsecase) ReduceQuantityProduct(ctx context.Context, params []*model.OrderItem) error {

	for _, item := range params {

		product, err := pu.GetProductByID(ctx, item.ProductId)
		if err != nil {
			logger.Error(ctx, "usecase:product", "Failed Get Product By Id", err, logrus.Fields{
				"product_id": item.ProductId,
			})
			return err
		}

		err = pu.ProductService.ReduceQuantityProduct(ctx, product, item.Quantity)
		if err != nil {
			logger.Error(ctx, "usecase:product", "Failed reduce quantity product", err, logrus.Fields{
				"product_id": item.ProductId,
			})
			return err
		}

		// Invalidate cache
		if pu.Redis != nil {
			pu.Redis.Del(ctx, "product:"+item.ProductId, "products:all")
		}

	}
	return nil
}

func (pu *productUsecase) RestoreQuantityProduct(ctx context.Context, params []*model.OrderItem) error {
	for _, item := range params {
		product, err := pu.GetProductByID(ctx, item.ProductId)
		if err != nil {
			logger.Error(ctx, "usecase:product", "Failed to get product for stock restoration", err, logrus.Fields{
				"product_id": item.ProductId,
			})
			return err
		}

		err = pu.ProductService.RestoreQuantityProduct(ctx, product, item.Quantity)
		if err != nil {
			logger.Error(ctx, "usecase:product", "Failed to restore product stock", err, logrus.Fields{
				"product_id": item.ProductId,
				"quantity":   item.Quantity,
			})
			return err
		}

		// Invalidate cache
		if pu.Redis != nil {
			pu.Redis.Del(ctx, "product:"+item.ProductId, "products:all")
		}

		logger.Info(ctx, "usecase:product", "Product stock restored", logrus.Fields{
			"product_id": item.ProductId,
			"quantity":   item.Quantity,
		})
	}
	return nil
}
