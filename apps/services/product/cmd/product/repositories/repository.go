package repositories

import (
	"context"
	"product-service/model"

	"go.mongodb.org/mongo-driver/mongo"
)

type ProductRepository interface {
	InsertProduct(ctx context.Context, product *model.Product) (*model.Product, error)
	FindAllProducts(ctx context.Context) ([]*model.Product, error)
	FindProductByID(ctx context.Context, productId string) (*model.Product, error)
	UpdateProduct(ctx context.Context, product *model.Product, productId string) (*model.Product, error)
	DeleteProduct(ctx context.Context, productId string) error
	SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error)
}
type productRepository struct {
	DB *mongo.Database
}

func NewProductRepository(db *mongo.Database) ProductRepository {
	return &productRepository{DB: db}
}
