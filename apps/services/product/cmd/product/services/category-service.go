package services

import (
	"context"
	"errors"
	"product-service/cmd/product/repositories"
	"product-service/infrastructure/logger"
	"product-service/model"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/mongo"
)

type CategoryService interface {
	CreateCategory(ctx context.Context, param *model.CreateCategoryRequest) (*model.Category, error)
	UpdateCategory(ctx context.Context, param *model.CreateCategoryRequest, categoryId string) (*model.Category, error)
	DeleteCategory(ctx context.Context, categoryId string) error
	GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error)
	GetAllCategory(ctx context.Context) ([]*model.Category, error)
}

type categoryService struct {
	CategoryRepository repositories.CategoryRepository
}

func NewCategoryService(categoryRepository repositories.CategoryRepository) CategoryService {
	return &categoryService{
		CategoryRepository: categoryRepository,
	}
}

func (c *categoryService) CreateCategory(ctx context.Context, param *model.CreateCategoryRequest) (*model.Category, error) {
	if param.ParentID != nil {
		parentIDString := param.ParentID.Hex()
		_, err := c.CategoryRepository.SelectCategoryById(ctx, parentIDString)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				logger.Warn(ctx, "service:category", "Category creation denied: Parent category not found", logrus.Fields{
					"parent_id": parentIDString,
				})
				return nil, err
			}
			return nil, err
		}
	}

	category := &model.Category{
		Name:      param.Name,
		Slug:      param.Slug,
		ParentID:  param.ParentID,
		Templates: param.Templates,
	}

	newCategory, err := c.CategoryRepository.InsertCategory(ctx, category)
	if err != nil {
		return nil, err
	}

	logger.Info(ctx, "service:category", "Category successfully created", logrus.Fields{
		"category_id": newCategory.ID,
		"name":        newCategory.Name,
	})
	return newCategory, nil
}

func (c *categoryService) UpdateCategory(ctx context.Context, param *model.CreateCategoryRequest, categoryId string) (*model.Category, error) {
	category := &model.Category{
		Name:      param.Name,
		Slug:      param.Slug,
		ParentID:  param.ParentID,
		Templates: param.Templates,
	}

	newCategory, err := c.CategoryRepository.UpdateCategory(ctx, category, categoryId)
	if err != nil {
		// Technical errors are already logged in Repository
		return nil, err
	}

	logger.Info(ctx, "service:category", "Category successfully updated", logrus.Fields{
		"category_id": categoryId,
	})
	return newCategory, nil
}

func (c *categoryService) DeleteCategory(ctx context.Context, categoryId string) error {
	err := c.CategoryRepository.DeleteCategory(ctx, categoryId)
	if err != nil {
		return err
	}

	logger.Info(ctx, "service:category", "Category successfully deleted", logrus.Fields{
		"category_id": categoryId,
	})
	return nil
}

func (c *categoryService) GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	result, err := c.CategoryRepository.SelectCategoryById(ctx, categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "service:category", "Category retrieval failed: Not found", logrus.Fields{
				"category_id": categoryId,
			})
			return nil, err
		}
		return nil, err
	}
	return result, nil
}

func (c *categoryService) GetAllCategory(ctx context.Context) ([]*model.Category, error) {
	result, err := c.CategoryRepository.SelectCategories(ctx)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "service:category", "Categories retrieval: No records found", nil)
			return nil, err
		}
		return nil, err
	}
	return result, nil
}
