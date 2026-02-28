package handlers

import (
	"errors"
	"net/http"
	"product-service/cmd/product/usecases"
	"product-service/infrastructure/logger"
	"product-service/model"
	"product-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/mongo"
)

type CategoryHandler interface {
	CreateCategory(c *gin.Context)
	Updatecategory(c *gin.Context)
	Deletecategory(c *gin.Context)
	GetCategoryById(c *gin.Context)
	GetAllCategory(c *gin.Context)
}

type categoryHandler struct {
	CategoryUsecase usecases.CategoryUsecase
}

func NewCategoryHandler(categoryUsecase usecases.CategoryUsecase) CategoryHandler {
	return &categoryHandler{
		CategoryUsecase: categoryUsecase,
	}
}

func (ch *categoryHandler) CreateCategory(c *gin.Context) {
	ctx := c.Request.Context()
	var param *model.CreateCategoryRequest

	if err := c.ShouldBindJSON(&param); err != nil {
		logger.Warn(ctx, "delivery:http", "Category registration denied: Invalid request body", nil)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ch.CategoryUsecase.CreateCategory(ctx, param)
	if err != nil {
		// Error ditangani middleware global atau logged di layer usecase/repo
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Category created successfully response sent", logrus.Fields{
		"category_id": result.ID,
	})
	utils.ResponseSuccess(c, result, "Success Create Category", http.StatusCreated)
}

func (ch *categoryHandler) Updatecategory(c *gin.Context) {
	ctx := c.Request.Context()
	categoryId := c.Param("category_id")

	if categoryId == "" {
		logger.Warn(ctx, "delivery:http", "Category update denied: Missing category_id parameter", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Category Id is required")
		return
	}

	var param *model.CreateCategoryRequest
	if err := c.ShouldBindJSON(&param); err != nil {
		logger.Warn(ctx, "delivery:http", "Category update denied: Invalid request body", nil)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ch.CategoryUsecase.UpdateCategory(ctx, param, categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Category update failed: Document not found", logrus.Fields{"category_id": categoryId})
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Category update response sent", logrus.Fields{"category_id": categoryId})
	utils.ResponseSuccess(c, result, "Success Update Category", http.StatusOK)
}

func (ch *categoryHandler) Deletecategory(c *gin.Context) {
	ctx := c.Request.Context()
	categoryId := c.Param("category_id")

	if categoryId == "" {
		logger.Warn(ctx, "delivery:http", "Category deletion denied: Missing category_id", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Category Id is required")
		return
	}

	err := ch.CategoryUsecase.DeleteCategory(ctx, categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Category deletion failed: Document not found", logrus.Fields{"category_id": categoryId})
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Category deletion response sent", logrus.Fields{"category_id": categoryId})
	utils.ResponseSuccess(c, nil, "Success Delete Category", http.StatusOK)
}

func (ch *categoryHandler) GetCategoryById(c *gin.Context) {
	ctx := c.Request.Context()
	categoryId := c.Param("category_id")

	result, err := ch.CategoryUsecase.GetCategoryById(ctx, categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Category retrieval: No document found", logrus.Fields{"category_id": categoryId})
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Silent success for read operations
	utils.ResponseSuccess(c, result, "Success Get Category", http.StatusOK)
}

func (ch *categoryHandler) GetAllCategory(c *gin.Context) {
	ctx := c.Request.Context()
	result, err := ch.CategoryUsecase.GetAllCategory(ctx)
	if err != nil {
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Silent success for read operations
	utils.ResponseSuccess(c, result, "Success Get All Categories", http.StatusOK)
}
