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
	result, err := c.CategoryServices.CreateCategory(ctx, category)
	if err != nil {
		// We don't log Info/Warn here as the Service layer already handles it
		return nil, err
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

	logger.Info(ctx, "usecase:category", "Category deletion orchestrated successfully", logrus.Fields{
		"category_id": categoryId,
	})
	return nil
}

func (c categoryUsecase) GetCategoryById(ctx context.Context, categoryId string) (*model.Category, error) {
	result, err := c.CategoryServices.GetCategoryById(ctx, categoryId)
	if err != nil {
		return nil, err
	}

	// Silent success for read operations
	return result, nil
}

func (c categoryUsecase) GetAllCategory(ctx context.Context) ([]*model.Category, error) {
	result, err := c.CategoryServices.GetAllCategory(ctx)
	if err != nil {
		return nil, err
	}

	// Silent success for read operations
	return result, nil
}
