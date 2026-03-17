package usecases

import (
	"context"
	"encoding/json"
	"product-service/cmd/product/services"
	"product-service/infrastructure/logger"
	"product-service/model"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type CategoryUsecase interface {
	CreateCategory(ctx context.Context, category *model.CreateCategoryRequest) (*model.Category, error)
	UpdateCategory(ctx context.Context, category *model.CreateCategoryRequest, categoryId string) (*model.Category, error)
	DeleteCategory(ctx context.Context, categoryId string) error
	GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error)
	GetAllCategory(ctx context.Context) ([]*model.Category, error)
}

type categoryUsecase struct {
	CategoryServices services.CategoryService
	Redis            *redis.Client
}

func NewCategoryUsecase(categoryServices services.CategoryService, redis *redis.Client) CategoryUsecase {
	return &categoryUsecase{
		CategoryServices: categoryServices,
		Redis:            redis,
	}
}

func (c categoryUsecase) CreateCategory(ctx context.Context, category *model.CreateCategoryRequest) (*model.Category, error) {
	result, err := c.CategoryServices.CreateCategory(ctx, category)
	if err != nil {
		// We don't log Info/Warn here as the Service layer already handles it
		return nil, err
	}

	// Invalidate cache
	if c.Redis != nil {
		c.Redis.Del(ctx, "categories:all")
	}

	logger.Info(ctx, "usecase:category", "Category creation orchestrated successfully", logrus.Fields{
		"category_name": category.Name,
	})
	return result, nil
}

func (c categoryUsecase) UpdateCategory(ctx context.Context, category *model.CreateCategoryRequest, categoryId string) (*model.Category, error) {
	result, err := c.CategoryServices.UpdateCategory(ctx, category, categoryId)
	if err != nil {
		return nil, err
	}

	// Invalidate cache
	if c.Redis != nil {
		c.Redis.Del(ctx, "category:"+categoryId, "categories:all")
	}

	logger.Info(ctx, "usecase:category", "Category update orchestrated successfully", logrus.Fields{
		"category_id": categoryId,
	})
	return result, nil
}

func (c categoryUsecase) DeleteCategory(ctx context.Context, categoryId string) error {
	err := c.CategoryServices.DeleteCategory(ctx, categoryId)
	if err != nil {
		return err
	}

	// Invalidate cache
	if c.Redis != nil {
		c.Redis.Del(ctx, "category:"+categoryId, "categories:all")
	}

	logger.Info(ctx, "usecase:category", "Category deletion orchestrated successfully", logrus.Fields{
		"category_id": categoryId,
	})
	return nil
}

func (c categoryUsecase) GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	cacheKey := "category:" + categoryId
	if c.Redis != nil {
		var cachedCategory model.Category
		val, err := c.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			if err := json.Unmarshal([]byte(val), &cachedCategory); err == nil {
				return &cachedCategory, nil
			}
		}
	}

	result, err := c.CategoryServices.GetCategoryById(ctx, categoryId)
	if err != nil {
		return nil, err
	}

	// Cache result
	if c.Redis != nil {
		data, _ := json.Marshal(result)
		c.Redis.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	// Silent success for read operations
	return result, nil
}

func (c categoryUsecase) GetAllCategory(ctx context.Context) ([]*model.Category, error) {
	cacheKey := "categories:all"
	if c.Redis != nil {
		var cachedCategories []*model.Category
		val, err := c.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			if err := json.Unmarshal([]byte(val), &cachedCategories); err == nil {
				return cachedCategories, nil
			}
		}
	}

	result, err := c.CategoryServices.GetAllCategory(ctx)
	if err != nil {
		return nil, err
	}

	// Cache result
	if c.Redis != nil {
		data, _ := json.Marshal(result)
		c.Redis.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	// Silent success for read operations
	return result, nil
}
