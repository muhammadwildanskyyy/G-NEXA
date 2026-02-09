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
	logFields := logrus.Fields{
		"layer":         "services",
		"func":          "CreateCategory()",
		"category_name": param.Name,
	}

	if param.ParentID != nil {
		parentOID := *param.ParentID
		parentIDString := parentOID.Hex()
		_, err := c.CategoryRepository.SelectCategoryById(ctx, parentIDString)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				logger.LogError(logFields, "Parent category not found", "c.CategoryRepository.SelectCategoryById()", err)
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
		logger.LogError(logFields, "Failed Create Category", "c.CategoryRepository.InsertCategory()", err)
		return nil, err
	}
	return newCategory, nil

}

func (c *categoryService) UpdateCategory(ctx context.Context, param *model.CreateCategoryRequest, categoryId string) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":         "services",
		"func":          "UpdateCategory()",
		"category_name": param.Name,
		"category_id":   categoryId,
	}
	category := &model.Category{
		Name:      param.Name,
		Slug:      param.Slug,
		ParentID:  param.ParentID,
		Templates: param.Templates,
	}

	newCategory, err := c.CategoryRepository.UpdateCategory(ctx, category, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed Update Category", "c.CategoryRepository.UpdateCategory()", err)
		return nil, err
	}
	return newCategory, nil

}

func (c *categoryService) DeleteCategory(ctx context.Context, categoryId string) error {
	logFields := logrus.Fields{
		"layer":       "services",
		"func":        "DeleteCategory()",
		"category_id": categoryId,
	}
	err := c.CategoryRepository.DeleteCategory(ctx, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed Delete Category", "c.CategoryRepository.DeleteCategory()", err)
		return err
	}
	return nil
}

func (c *categoryService) GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":       "services",
		"func":        "GetCategoryById()",
		"category_id": categoryId,
	}

	result, err := c.CategoryRepository.SelectCategoryById(ctx, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed Get CategoryById", "c.CategoryRepository.SelectCategoryById()", err)
		return nil, err
	}
	return result, nil
}

func (c *categoryService) GetAllCategory(ctx context.Context) ([]*model.Category, error) {
	logFields := logrus.Fields{
		"layer": "services",
		"func":  "GetAllCategory()",
	}

	result, err := c.CategoryRepository.SelectCategories(ctx)
	if err != nil {
		logger.LogError(logFields, "Failed GetAllCategory", "c.CategoryRepository.SelectCategories()", err)
		return nil, err
	}
	return result, nil
}
