package repositories

import (
	"context"
	"product-service/infrastructure/logger"
	"product-service/model"
	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	productCollection = "products"
)

func (r *productRepository) InsertProduct(ctx context.Context, product *model.Product) (*model.Product, error) {

	logFields := logrus.Fields{
		"layer":    "Repository",
		"func":     "InsertProduct()",
		"store_id": product.StoreID,
		"name":     product.Name,
		"price":    product.Price,
	}
	now := time.Now()
	product.CreatedAt = now
	product.UpdatedAt = now

	result, err := r.DB.Collection(productCollection).InsertOne(ctx, product)
	if err != nil {
		logger.LogError(logFields, "❌ Failed to insert product into MongoDB", "r.DB.Collection().Find()", err)
		return nil, err
	}

	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		product.ID = oid
	}

	return product, nil
}

func (r *productRepository) FindAllProducts(ctx context.Context) ([]*model.Product, error) {

	logFields := logrus.Fields{
		"layer": "Repository",
		"func":  "FindAllProducts()",
	}

	// todo : implementasi pagination

	var products []*model.Product

	cursor, err := r.DB.Collection(productCollection).Find(ctx, bson.M{})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Products not found")
			return nil, err
		}
		logger.LogError(logFields, "❌ Failed to find all product into MongoDB", "r.DB.Collection().Find()", err)
		return nil, err
	}

	err = cursor.All(ctx, &products)
	defer cursor.Close(ctx)
	if err != nil {
		logger.LogError(logFields, "❌ Failed to find all product into MongoDB", "cursor.All()", err)
		return nil, err
	}

	return products, nil

}

func (r *productRepository) FindProductByID(ctx context.Context, productId string) (*model.Product, error) {
	logFields := logrus.Fields{
		"layer":      "Repository",
		"func":       "FindProductByID()",
		"product_id": productId,
	}

	objID, err := primitive.ObjectIDFromHex(productId)
	if err != nil {
		logger.LogError(logFields, "Objec Id is invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	var product model.Product
	err = r.DB.Collection(productCollection).FindOne(ctx, bson.M{"_id": objID}).Decode(&product)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Product not found")
			return nil, err
		}
		logger.LogError(logFields, "❌ Failed to find product into MongoDB by id", "r.DB.Collection().FindOne()", err)
		return nil, err
	}
	return &product, nil

}

func (r *productRepository) UpdateProduct(ctx context.Context, product *model.Product, productId string) (*model.Product, error) {
	logFields := logrus.Fields{
		"layer":      "Repository",
		"func":       "UpdateProduct()",
		"store_id":   product.StoreID,
		"product_id": product.ID,
		"name":       product.Name,
	}
	now := time.Now()
	product.UpdatedAt = now

	validProductId, err := primitive.ObjectIDFromHex(productId)
	if err != nil {
		logger.LogError(logFields, "Objec Id is invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	var productUpdate model.Product
	err = r.DB.Collection(productCollection).FindOneAndUpdate(ctx, bson.M{"_id": validProductId}, bson.M{
		"$set": product}, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&productUpdate)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Product not found")
			return nil, err
		}
		logger.LogError(logFields, "Failed to update product into MongoDB", "r.DB.Collection().FindOneAndUpdate()", err)
		return nil, err
	}
	return &productUpdate, nil

}

func (r *productRepository) DeleteProduct(ctx context.Context, productId string) error {
	logFields := logrus.Fields{
		"layer":      "Repository",
		"func":       "DeleteProduct()",
		"product_id": productId,
	}

	objID, err := primitive.ObjectIDFromHex(productId)
	if err != nil {
		logger.LogError(logFields, "Objec Id is invalid", "primitive.ObjectIDFromHex()", err)
		return err
	}
	err = r.DB.Collection(productCollection).FindOneAndDelete(ctx, bson.M{"_id": objID}).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Product not found")
			return err
		}
		logger.LogError(logFields, "Failed to delete product from MongoDB", "r.DB.Collection().FindOneAndDelete()", err)
		return err
	}

	return nil

}

func (r *productRepository) SelectProductsByCategoryId(ctx context.Context, categoriId string) ([]*model.Product, error) {

	logFields := logrus.Fields{
		"layer":       "Repository",
		"func":        "SelectProductsByCategoriId()",
		"category_id": categoriId,
	}

	objID, err := primitive.ObjectIDFromHex(categoriId)
	if err != nil {
		logger.LogError(logFields, "Objec Id is invalid", "categoriId", err)
		return nil, err
	}

	var products []*model.Product

	cursor, err := r.DB.Collection(productCollection).Find(ctx, bson.M{"category_id": objID})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Product not found")
			return nil, err
		}
		logger.LogError(logFields, "Failed to find products by categoriId", "r.DB.Collection().Find()", err)
		return nil, err
	}
	err = cursor.All(ctx, &products)
	if err != nil {
		logger.LogError(logFields, "Failed to find all products by categoriId", "cursor.All()", err)
	}
	defer cursor.Close(ctx)
	return products, nil

}
