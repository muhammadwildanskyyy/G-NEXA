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

const CategoryCollection = "categories"

type CategoryRepository interface {
	InsertCategory(ctx context.Context, category *model.Category) (*model.Category, error)
	UpdateCategory(ctx context.Context, category *model.Category, categoryId string) (*model.Category, error)
	DeleteCategory(ctx context.Context, categoryId string) error
	SelectCategories(ctx context.Context) ([]*model.Category, error)
	SelectCategoryById(ctx context.Context, categoryId string) (*model.Category, error)
}

type categoryRepository struct {
	DB *mongo.Database
}

func NewCategoryRepository(db *mongo.Database) CategoryRepository {
	return &categoryRepository{
		DB: db,
	}
}

func (c *categoryRepository) InsertCategory(ctx context.Context, category *model.Category) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":         "Repository",
		"func":          "InsertCategory",
		"category_name": category.Name,
	}
	now := time.Now()
	category.CreatedAt = now
	category.UpdatedAt = now

	result, err := c.DB.Collection(CategoryCollection).InsertOne(ctx, category)
	if err != nil {
		logger.LogError(logFields, "❌ Failed to insert category into MongoDB", "c.DB.Collection().InsertOne()", err)
		return nil, err
	}

	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		category.ID = oid
	}

	return category, nil
}

func (c *categoryRepository) UpdateCategory(ctx context.Context, category *model.Category, categoryId string) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":         "Repository",
		"func":          "UpdateCategory",
		"category_name": category.Name,
		"category_id":   category.ID,
	}
	now := time.Now()
	category.UpdatedAt = now

	validcategoryId, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.LogError(logFields, "Objec id is invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	var categoryUpdate model.Category
	err = c.DB.Collection(CategoryCollection).FindOneAndUpdate(ctx, bson.M{"_id": validcategoryId}, bson.M{
		"$set": category}, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&categoryUpdate)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Category not found")
			return nil, err
		}
		logger.LogError(logFields, "Failed to update category", "c.DB.Collection().FindOneAndUpdate()", err)
		return nil, err
	}
	return &categoryUpdate, nil

}

func (c *categoryRepository) DeleteCategory(ctx context.Context, categoryId string) error {
	logFields := logrus.Fields{
		"layer":       "Repository",
		"func":        "DeleteCategory",
		"category_id": categoryId,
	}

	isValidCategoryId, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.LogError(logFields, "Objec id is invalid", "primitive.ObjectIDFromHex()", err)
		return err
	}
	err = c.DB.Collection(CategoryCollection).FindOneAndDelete(ctx, bson.M{"_id": isValidCategoryId}).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Category not found")
			return err
		}
		logger.LogError(logFields, "Failed to delete category", "c.DB.Collection().FindOneAndDelete()", err)
		return err
	}
	return nil
}

func (c *categoryRepository) SelectCategories(ctx context.Context) ([]*model.Category, error) {
	logFields := logrus.Fields{
		"layer": "Repository",
		"func":  "SelectCategories",
	}

	var categories []*model.Category

	cursor, err := c.DB.Collection(CategoryCollection).Find(ctx, bson.M{})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Category not found")
			return nil, err
		}
		logger.LogError(logFields, " Failed to find all category into MongoDB", "c.DB.Collection().Find()", err)
		return nil, err
	}

	err = cursor.All(ctx, &categories)
	defer cursor.Close(ctx)
	if err != nil {
		logger.LogError(logFields, "Failed to find all category into MongoDB", "cursor.All()", err)
		return nil, err
	}
	return categories, nil
}

func (c *categoryRepository) SelectCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":       "Repository",
		"func":        "SelectCategoryById",
		"category_id": categoryId,
	}
	isValidCategoryId, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.LogError(logFields, "Objec id is invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	var category *model.Category
	err = c.DB.Collection(CategoryCollection).FindOne(ctx, bson.M{"_id": isValidCategoryId}).Decode(&category)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Log.WithFields(logFields).Warn("Category not found")
			return nil, err
		}
		logger.LogError(logFields, "Failed to find category", "c.DB.Collection().FindOne()", err)
		return nil, err
	}
	return category, nil

}
