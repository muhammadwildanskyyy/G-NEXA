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
	now := time.Now()
	category.CreatedAt = now
	category.UpdatedAt = now

	logger.Debug(ctx, "repository:category", "Executing InsertOne category", logrus.Fields{"name": category.Name})

	result, err := c.DB.Collection(CategoryCollection).InsertOne(ctx, category)
	if err != nil {
		logger.Error(ctx, "repository:category", "Database error: InsertOne failed", err, nil)
		return nil, err
	}

	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		category.ID = oid
	}

	return category, nil
}

func (c *categoryRepository) UpdateCategory(ctx context.Context, category *model.Category, categoryId string) (*model.Category, error) {
	now := time.Now()
	category.UpdatedAt = now

	validCategoryId, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.Warn(ctx, "repository:category", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": categoryId})
		return nil, err
	}

	logger.Debug(ctx, "repository:category", "Executing FindOneAndUpdate category", logrus.Fields{"id": categoryId})

	var categoryUpdate model.Category
	err = c.DB.Collection(CategoryCollection).FindOneAndUpdate(
		ctx,
		bson.M{"_id": validCategoryId},
		bson.M{"$set": category},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&categoryUpdate)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, err // Biarkan layer di atasnya yang melakukan log Warn "Not Found"
		}
		logger.Error(ctx, "repository:category", "Database error: FindOneAndUpdate failed", err, logrus.Fields{"id": categoryId})
		return nil, err
	}
	return &categoryUpdate, nil
}

func (c *categoryRepository) DeleteCategory(ctx context.Context, categoryId string) error {
	isValidCategoryId, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.Warn(ctx, "repository:category", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": categoryId})
		return err
	}

	logger.Debug(ctx, "repository:category", "Executing FindOneAndDelete category", logrus.Fields{"id": categoryId})

	err = c.DB.Collection(CategoryCollection).FindOneAndDelete(ctx, bson.M{"_id": isValidCategoryId}).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return err
		}
		logger.Error(ctx, "repository:category", "Database error: FindOneAndDelete failed", err, logrus.Fields{"id": categoryId})
		return err
	}
	return nil
}

func (c *categoryRepository) SelectCategories(ctx context.Context) ([]*model.Category, error) {
	logger.Debug(ctx, "repository:category", "Executing Find all categories", nil)

	var categories []*model.Category
	cursor, err := c.DB.Collection(CategoryCollection).Find(ctx, bson.M{})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, err
		}
		logger.Error(ctx, "repository:category", "Database error: Find failed", err, nil)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &categories)
	if err != nil {
		logger.Error(ctx, "repository:category", "Database error: Cursor decoding failed", err, nil)
		return nil, err
	}

	if len(categories) == 0 {
		return nil, mongo.ErrNoDocuments
	}

	return categories, nil
}

func (c *categoryRepository) SelectCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	isValidCategoryId, err := primitive.ObjectIDFromHex(categoryId)
	if err != nil {
		logger.Warn(ctx, "repository:category", "Operation failed: Invalid ObjectID hex", logrus.Fields{"id": categoryId})
		return nil, err
	}

	logger.Debug(ctx, "repository:category", "Executing FindOne category by ID", logrus.Fields{"id": categoryId})

	var category *model.Category
	err = c.DB.Collection(CategoryCollection).FindOne(ctx, bson.M{"_id": isValidCategoryId}).Decode(&category)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, err
		}
		logger.Error(ctx, "repository:category", "Database error: FindOne failed", err, logrus.Fields{"id": categoryId})
		return nil, err
	}
	return category, nil
}
