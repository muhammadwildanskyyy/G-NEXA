package usecases

import (
	"context"
	"product-service/cmd/product/services"
	"product-service/infrastructure/logger"
	"product-service/model"

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
}

func NewCategoryUsecase(categoryServices services.CategoryService) CategoryUsecase {
	return &categoryUsecase{
		CategoryServices: categoryServices,
	}
}

func (c categoryUsecase) CreateCategory(ctx context.Context, category *model.CreateCategoryRequest) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":         "usecases",
		"fun":           "CreateCategory()",
		"category_name": category.Name,
	}

	result, err := c.CategoryServices.CreateCategory(ctx, category)
	if err != nil {
		logger.LogError(logFields, "Failed Create Catregory", "CreateCategory()", err)
		return nil, err
	}
	return result, nil
}

func (c categoryUsecase) UpdateCategory(ctx context.Context, category *model.CreateCategoryRequest, categoryId string) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":         "usecases",
		"fun":           "UpdateCategory()",
		"category_name": category.Name,
		"category_id":   categoryId,
	}

	result, err := c.CategoryServices.UpdateCategory(ctx, category, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed Update Catregory", "UpdateCategory()", err)
		return nil, err
	}
	return result, nil
}

func (c categoryUsecase) DeleteCategory(ctx context.Context, categoryId string) error {
	logFields := logrus.Fields{
		"layer":         "usecases",
		"fun":           "DeleteCategory()",
		"category_name": categoryId,
	}
	err := c.CategoryServices.DeleteCategory(ctx, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed Delete Catregory", "DeleteCategory()", err)
		return err
	}
	return nil
}

func (c categoryUsecase) GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	logFields := logrus.Fields{
		"layer":         "usecases",
		"fun":           "GetCategoryById()",
		"category_name": categoryId,
	}
	result, err := c.CategoryServices.GetCategoryById(ctx, categoryId)
	if err != nil {
		logger.LogError(logFields, "Failed Get CategoryById", "GetCategoryById()", err)
		return nil, err
	}
	return result, nil
}

func (c categoryUsecase) GetAllCategory(ctx context.Context) ([]*model.Category, error) {
	logFields := logrus.Fields{
		"layer": "usecases",
		"fun":   "GetAllCategory()",
	}
	result, err := c.CategoryServices.GetAllCategory(ctx)
	if err != nil {
		logger.LogError(logFields, "Failed GetAllCategory", "GetAllCategory()", err)
		return nil, err
	}
	return result, nil
}
