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
	now := time.Now()
	product.CreatedAt = now
	product.UpdatedAt = now

	logger.Debug(ctx, "repository:product", "Executing InsertOne product", logrus.Fields{
		"store_id": product.StoreID,
		"name":     product.Name,
	})

	result, err := r.DB.Collection(productCollection).InsertOne(ctx, product)
	if err != nil {
		logger.Error(ctx, "repository:product", "Database error: InsertOne failed", err, nil)
		return nil, err
	}

	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		product.ID = oid
	}

	return product, nil
}

func (r *productRepository) FindAllProducts(ctx context.Context, param *model.ProductQueryParam) ([]*model.Product, int64, error) {
	// --- 1. BUILD QUERY FILTER ---
	filter := bson.M{}
	if param.Search != "" {
		filter["name"] = bson.M{"$regex": param.Search, "$options": "i"}
	}
	if param.CategoryID != "" {
		catObjID, err := primitive.ObjectIDFromHex(param.CategoryID)
		if err == nil {
			filter["category_id"] = catObjID
		}
	}
	if param.StoreID != "" {
		filter["store_id"] = param.StoreID
	}
	if param.Condition != "" {
		filter["condition"] = param.Condition
	}
	if param.MinPrice > 0 || param.MaxPrice > 0 {
		priceFilter := bson.M{}
		if param.MinPrice > 0 {
			priceFilter["$gte"] = param.MinPrice
		}
		if param.MaxPrice > 0 {
			priceFilter["$lte"] = param.MaxPrice
		}
		filter["price"] = priceFilter
	}
	filter["is_active"] = true

	// --- 2. BUILD SORTING ---
	sortOpts := bson.D{{Key: "_id", Value: -1}}
	switch param.SortBy {
	case "price_asc":
		sortOpts = bson.D{{Key: "price", Value: 1}}
	case "price_desc":
		sortOpts = bson.D{{Key: "price", Value: -1}}
	case "views":
		sortOpts = bson.D{{Key: "views", Value: -1}}
	case "oldest":
		sortOpts = bson.D{{Key: "_id", Value: 1}}
	}

	// --- 3. EXECUTE QUERY ---
	var products []*model.Product
	skip := (param.Page - 1) * param.Limit

	opts := options.Find()
	opts.SetLimit(param.Limit).SetSkip(skip).SetSort(sortOpts)

	logger.Debug(ctx, "repository:product", "Executing Find products with filter", logrus.Fields{"filter": filter})

	cursor, err := r.DB.Collection(productCollection).Find(ctx, filter, opts)
	if err != nil {
		logger.Error(ctx, "repository:product", "Database error: Find failed", err, nil)
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &products); err != nil {
		logger.Error(ctx, "repository:product", "Database error: Cursor decoding failed", err, nil)
		return nil, 0, err
	}

	// --- 4. COUNT TOTAL DOCUMENTS ---
	totalCount, err := r.DB.Collection(productCollection).CountDocuments(ctx, filter)
	if err != nil {
		logger.Error(ctx, "repository:product", "Database error: CountDocuments failed", err, nil)
		return nil, 0, err
	}

	if len(products) == 0 {
		return nil, 0, mongo.ErrNoDocuments
	}

	return products, totalCount, nil
}

func (r *productRepository) FindProductByID(ctx context.Context, productId string) (*model.Product, error) {
	objID, err := primitive.ObjectIDFromHex(productId)
	if err != nil {
		logger.Warn(ctx, "repository:product", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": productId})
		return nil, err
	}

	logger.Debug(ctx, "repository:product", "Executing FindOne product by ID", logrus.Fields{"id": productId})

	var product model.Product
	err = r.DB.Collection(productCollection).FindOne(ctx, bson.M{"_id": objID}).Decode(&product)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, err
		}
		logger.Error(ctx, "repository:product", "Database error: FindOne failed", err, logrus.Fields{"id": productId})
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) UpdateProduct(ctx context.Context, product *model.Product, productId string) (*model.Product, error) {
	now := time.Now()
	product.UpdatedAt = now

	validProductId, err := primitive.ObjectIDFromHex(productId)
	if err != nil {
		logger.Warn(ctx, "repository:product", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": productId})
		return nil, err
	}

	logger.Debug(ctx, "repository:product", "Executing FindOneAndUpdate product", logrus.Fields{"id": productId})

	var productUpdate model.Product
	err = r.DB.Collection(productCollection).FindOneAndUpdate(
		ctx,
		bson.M{"_id": validProductId},
		bson.M{"$set": product},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&productUpdate)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, err
		}
		logger.Error(ctx, "repository:product", "Database error: FindOneAndUpdate failed", err, logrus.Fields{"id": productId})
		return nil, err
	}
	return &productUpdate, nil
}

func (r *productRepository) DeleteProduct(ctx context.Context, productId string) error {
	objID, err := primitive.ObjectIDFromHex(productId)
	if err != nil {
		logger.Warn(ctx, "repository:product", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": productId})
		return err
	}

	logger.Debug(ctx, "repository:product", "Executing FindOneAndDelete product", logrus.Fields{"id": productId})

	err = r.DB.Collection(productCollection).FindOneAndDelete(ctx, bson.M{"_id": objID}).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return err
		}
		logger.Error(ctx, "repository:product", "Database error: FindOneAndDelete failed", err, logrus.Fields{"id": productId})
		return err
	}
	return nil
}

func (r *productRepository) SelectProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {
	objID, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.Warn(ctx, "repository:product", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": categoryId})
		return nil, err
	}

	logger.Debug(ctx, "repository:product", "Executing Find products by category", logrus.Fields{"category_id": categoryId})

	var products []*model.Product
	cursor, err := r.DB.Collection(productCollection).Find(ctx, bson.M{"category_id": objID})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, err
		}
		logger.Error(ctx, "repository:product", "Database error: Find failed", err, logrus.Fields{"category_id": categoryId})
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &products); err != nil {
		logger.Error(ctx, "repository:product", "Database error: Decoding products failed", err, nil)
		return nil, err
	}
	return products, nil
}
