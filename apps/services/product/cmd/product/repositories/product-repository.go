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

func (r *productRepository) FindAllProducts(ctx context.Context, param *model.ProductQueryParam) ([]*model.Product, int64, error) {
	logFields := logrus.Fields{
		"layer": "Repository",
		"func":  "FindAllProducts()",
	}

	// --- 1. MEMBANGUN QUERY FILTER (bson.M) ---
	filter := bson.M{}

	// Filter Search (Nama Produk - Case Insensitive)
	if param.Search != "" {
		filter["name"] = bson.M{
			"$regex":   param.Search,
			"$options": "i",
		}
	}

	// Filter Category ID (Convert string ke ObjectID)
	if param.CategoryID != "" {
		catObjID, err := primitive.ObjectIDFromHex(param.CategoryID)
		if err == nil {
			filter["category_id"] = catObjID
		}
	}

	// Filter Store ID
	if param.StoreID != "" {
		filter["store_id"] = param.StoreID
	}

	// Filter Condition (new/used)
	if param.Condition != "" {
		filter["condition"] = param.Condition
	}

	// Filter Range Harga (Min & Max)
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

	// Hanya ambil yang aktif
	filter["is_active"] = true

	// --- 2. MEMBANGUN SORTING ---
	sortOpts := bson.D{{Key: "_id", Value: -1}}

	switch param.SortBy {
	case "price_asc":
		sortOpts = bson.D{{Key: "price", Value: 1}} // Termurah
	case "price_desc":
		sortOpts = bson.D{{Key: "price", Value: -1}} // Termahal
	case "views":
		sortOpts = bson.D{{Key: "views", Value: -1}} // Populer
	case "oldest":
		sortOpts = bson.D{{Key: "_id", Value: 1}}
	}

	// --- 3. EKSEKUSI QUERY ---
	var products []*model.Product
	skip := (param.Page - 1) * param.Limit

	opts := options.Find()
	opts.SetLimit(param.Limit)
	opts.SetSkip(skip)
	opts.SetSort(sortOpts)
	logger.Log.Infof("🔍 Filter MongoDB: %+v", filter)

	cursor, err := r.DB.Collection(productCollection).Find(ctx, filter, opts)
	if err != nil {
		logger.LogError(logFields, "❌ Failed to find products", "Find()", err)
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &products); err != nil {
		logger.LogError(logFields, "❌ Failed to decode products", "cursor.All()", err)
		return nil, 0, err
	}

	// --- 4. HITUNG TOTAL DATA (Sesuai Filter) ---

	totalCount, err := r.DB.Collection(productCollection).CountDocuments(ctx, filter)
	if err != nil {
		logger.LogError(logFields, "❌ Failed to count products", "CountDocuments()", err)
		return nil, 0, err
	}

	// Jika data kosong, return array kosong (nil) dan error NoDocuments
	if len(products) == 0 {
		return nil, 0, mongo.ErrNoDocuments
	}

	return products, totalCount, nil
	return nil, 0, nil
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
