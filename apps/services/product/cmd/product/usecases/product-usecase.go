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

func (p *productUsecase) GetProductByID(ctx context.Context, id string) (*model.Product, error) {
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

func (p *productUsecase) GetProducts(ctx context.Context, params *model.ProductQueryParam) (*model.PaginationProductResult, error) {
	logFields := logrus.Fields{
		"layer": "Usecase",
		"func":  "GetProducts()",
	}

	result, err := p.ProductService.GetProducts(ctx, params)
	if err != nil {
		logger.LogError(logFields, "Failed to get products", "p.ProductService.GetProducts()", err)
		return nil, err
	}
	return result, nil
}

func (p *productUsecase) UpodateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
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

func (p *productUsecase) DeleteProduct(ctx context.Context, id string) error {
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

func (p *productUsecase) SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
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

func (p *productUsecase) CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error) {

	result, err := p.ProductService.CreateProductBulk(ctx, products)
	if err != nil {
		return nil, err
	}
	return result, nil
}
