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
	GetProducts(ctx context.Context) ([]*model.Product, error)
	UpodateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error)
	DeleteProduct(ctx context.Context, id string) error
	SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error)
}
type productRepository struct {
	ProductService services.ProductService
}

func NewProductUsecase(productService services.ProductService) ProductUsecase {
	return &productRepository{ProductService: productService}
}

func (p *productRepository) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {
	logFields := logrus.Fields{
		"layer":       "Usecase",
		"func":        "CreateProduct()",
		"productName": product.Name,
	}

	result, err := p.ProductService.CreateProduct(ctx, product)
	if err != nil {
		logger.LogError(logFields, "Failed to create product", " p.ProductService.CreateProduct()", err)
		return nil, err
	}
	return result, nil

}

func (p *productRepository) GetProductByID(ctx context.Context, id string) (*model.Product, error) {
	logFields := logrus.Fields{
		"layer":     "Usecase",
		"func":      "GetProductByID()",
		"productId": id,
	}
	result, err := p.ProductService.GetProductById(ctx, id)
	if err != nil {
		logger.LogError(logFields, "Failed to get product", " p.ProductService.GetProductById()", err)
		return nil, err
	}
	return result, nil
}

func (p *productRepository) GetProducts(ctx context.Context) ([]*model.Product, error) {
	logFields := logrus.Fields{
		"layer": "Usecase",
		"func":  "GetProducts()",
	}
	result, err := p.ProductService.GetProducts(ctx)
	if err != nil {
		logger.LogError(logFields, "Failed to get products", " p.ProductService.GetProducts()", err)
		return nil, err
	}
	return result, nil
}

func (p *productRepository) UpodateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
	logFields := logrus.Fields{
		"layer":        "Usecase",
		"func":         "UpodateProduct()",
		"product_name": product.Name,
	}

	result, err := p.ProductService.UpdateProduct(ctx, product, productId)
	if err != nil {
		logger.LogError(logFields, "Failed to update product", " p.ProductService.UpdateProduct()", err)
		return nil, err
	}
	return result, nil

}

func (p *productRepository) DeleteProduct(ctx context.Context, id string) error {
	logFields := logrus.Fields{
		"layer": "Usecase",
		"func":  "DeleteProduct()",
	}
	err := p.ProductService.DeleteProduct(ctx, id)
	if err != nil {
		logger.LogError(logFields, "Failed to delete product", " p.ProductService.DeleteProduct()", err)
		return err
	}
	return nil
}

func (p *productRepository) SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
	logFields := logrus.Fields{
		"layer":      "Usecase",
		"func":       "SelectProductsByCategoryId()",
		"categoryId": categoryId,
	}

	result, err := p.ProductService.GetProductsByCategoryId(ctx, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed to get products", " p.ProductService.GetProductsByCategoryId()", err)
		return nil, err
	}
	return result, nil

}
