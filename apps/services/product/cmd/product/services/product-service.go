package services

import (
	"context"
	"product-service/cmd/product/repositories"
	"product-service/infrastructure/logger"
	"product-service/model"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProductService interface {
	CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error)
	UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error)
	DeleteProduct(ctx context.Context, productId string) error
	GetProductById(ctx context.Context, productId string) (*model.Product, error)
	GetProducts(ctx context.Context) ([]*model.Product, error)
	GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error)
}
type productService struct {
	ProductRepository repositories.ProductRepository
}

func NewProductService(productRepository repositories.ProductRepository) ProductService {
	return &productService{
		ProductRepository: productRepository,
	}
}

func (p *productService) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {

	logFeild := logrus.Fields{
		"layer":       "services",
		"func":        "CreateProduct()",
		"productName": product.Name,
	}

	CategoryId, err := primitive.ObjectIDFromHex(product.CategoryID)
	if err != nil {
		logger.LogError(logFeild, "Category Id Invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	productInput := &model.Product{
		StoreID:    product.StoreID,
		CategoryID: CategoryId,

		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,

		Price:    product.Price,
		Stock:    product.Stock,
		IsActive: product.IsActive,

		Weight:     product.Weight,
		Dimensions: product.Dimensions,

		Images:    product.Images,
		Thumbnail: product.Thumbnail,

		Specs: product.Specs,

		Tags: product.Tags,
	}

	newProduct, err := p.ProductRepository.InsertProduct(ctx, productInput)
	if err != nil {
		logger.LogError(logFeild, "Failed to insert product", " p.ProductRepository.InsertProduct()", err)
		return nil, err
	}
	return newProduct, nil
}

func (p *productService) UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
	logFeild := logrus.Fields{
		"layer":        "services",
		"func":         "UpdateProduct()",
		"product_name": product.Name,
	}

	CategoryId, err := primitive.ObjectIDFromHex(product.CategoryID)
	if err != nil {
		logger.LogError(logFeild, "Category Id Invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	productInput := &model.Product{
		StoreID:    product.StoreID,
		CategoryID: CategoryId,

		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,

		Price:    product.Price,
		Stock:    product.Stock,
		IsActive: product.IsActive,

		Weight:     product.Weight,
		Dimensions: product.Dimensions,

		Images:    product.Images,
		Thumbnail: product.Thumbnail,

		Specs: product.Specs,

		Tags: product.Tags,
	}
	newProduct, err := p.ProductRepository.UpdateProduct(ctx, productInput, productId)
	if err != nil {
		logger.LogError(logFeild, "Failed to update product", " p.ProductRepository.UpdateProduct()", err)
		return nil, err
	}
	return newProduct, nil
}

func (p *productService) DeleteProduct(ctx context.Context, productId string) error {
	logFeild := logrus.Fields{
		"layer":     "services",
		"func":      "DeleteProduct()",
		"productId": productId,
	}
	err := p.ProductRepository.DeleteProduct(ctx, productId)
	if err != nil {
		logger.LogError(logFeild, "Failed to delete product", " p.ProductRepository.DeleteProduct()", err)
		return err
	}
	return nil

}

func (p *productService) GetProductById(ctx context.Context, productId string) (*model.Product, error) {

	logFeild := logrus.Fields{
		"layer":     "services",
		"func":      "GetProductById()",
		"productId": productId,
	}
	product, err := p.ProductRepository.FindProductByID(ctx, productId)
	if err != nil {
		logger.LogError(logFeild, "Failed to get product", " p.ProductRepository.FindProductByID()", err)
		return nil, err
	}
	return product, nil
}

func (p *productService) GetProducts(ctx context.Context) ([]*model.Product, error) {

	logFeild := logrus.Fields{
		"layer": "services",
		"func":  "GetProducts()",
	}
	products, err := p.ProductRepository.FindAllProducts(ctx)
	if err != nil {
		logger.LogError(logFeild, "Failed to get products", " p.ProductRepository.FindAllProducts()", err)
		return nil, err
	}
	return products, nil
}

func (p *productService) GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {

	logFeild := logrus.Fields{
		"layer":      "services",
		"func":       "GetProductsByCategoryId()",
		"categoryId": categoryId,
	}

	result, err := p.ProductRepository.SelectProductsByCategoryId(ctx, categoryId)
	if err != nil {
		logger.LogError(logFeild, "Failed to get products by Category Id", " p.ProductRepository.SelectProductsByCategoryId()", err)
		return nil, err
	}
	return result, nil
}
