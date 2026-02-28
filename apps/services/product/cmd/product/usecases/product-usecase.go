package usecases

import (
	"context"
	"product-service/cmd/product/services"
	"product-service/infrastructure/logger"
	"product-service/model"

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
}

type productUsecase struct {
	ProductService services.ProductService
}

func NewProductUsecase(productService services.ProductService) ProductUsecase {
	return &productUsecase{ProductService: productService}
}

func (p *productUsecase) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {
	result, err := p.ProductService.CreateProduct(ctx, product)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "usecase:product", "Product creation orchestrated successfully", logrus.Fields{
		"product_name": product.Name,
	})
	return result, nil
}

func (p *productUsecase) GetProductByID(ctx context.Context, id string) (*model.Product, error) {
	result, err := p.ProductService.GetProductById(ctx, id)
	if err != nil {
		return nil, err
	}

	// Silent success for read operations
	return result, nil
}

func (p *productUsecase) GetProducts(ctx context.Context, params *model.ProductQueryParam) (*model.PaginationProductResult, error) {
	result, err := p.ProductService.GetProducts(ctx, params)
	if err != nil {
		return nil, err
	}

	// Silent success for read operations
	return result, nil
}

func (p *productUsecase) UpodateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
	result, err := p.ProductService.UpdateProduct(ctx, product, productId)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "usecase:product", "Product update orchestrated successfully", logrus.Fields{
		"product_id": productId,
	})
	return result, nil
}

func (p *productUsecase) DeleteProduct(ctx context.Context, id string) error {
	err := p.ProductService.DeleteProduct(ctx, id)
	if err != nil {
		return err
	}

	logger.Info(ctx, "usecase:product", "Product deletion orchestrated successfully", logrus.Fields{
		"product_id": id,
	})
	return nil
}

func (p *productUsecase) SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
	result, err := p.ProductService.GetProductsByCategoryId(ctx, categoryId)
	if err != nil {
		return nil, err
	}

	// Silent success for read operations
	return result, nil
}

func (p *productUsecase) CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error) {
	result, err := p.ProductService.CreateProductBulk(ctx, products)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "usecase:product", "Bulk product creation orchestrated successfully", logrus.Fields{
		"total_processed": len(result),
	})
	return result, nil
}
