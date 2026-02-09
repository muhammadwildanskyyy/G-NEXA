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
	logFields := logrus.Fields{
		"layer":  "handler",
		"func":   "CreateCategory()",
		"method": c.Request.Method,
	}
	var param *model.CreateCategoryRequest
	if err := c.ShouldBindJSON(&param); err != nil {
		logger.LogError(logFields, "Failed validate Request", "c.ShouldBindJSON(&param)", err)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ch.CategoryUsecase.CreateCategory(c.Request.Context(), param)
	if err != nil {
		logger.LogError(logFields, "Failed Create Category", "ch.CategoryUsecase.CreateCategory()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Create Category", http.StatusCreated)
}

func (ch *categoryHandler) Updatecategory(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "handler",
		"func":   "UpdateCategory()",
		"method": c.Request.Method,
	}
	categoryId := c.Param("category_id")
	if categoryId == "" {
		logger.LogError(logFields, "Category Id empty", "c.ShouldBindJSON()", errors.New("Product Id empty"))
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	var param *model.CreateCategoryRequest
	if err := c.ShouldBindJSON(&param); err != nil {
		logger.LogError(logFields, "Failed validate Request", "c.ShouldBindJSON(&param)", err)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ch.CategoryUsecase.UpdateCategory(c.Request.Context(), param, categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Category not found")
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		logger.LogError(logFields, "Failed Update Category", "ch.CategoryUsecase.UpdateCategory()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Update Category", http.StatusOK)
}

func (ch *categoryHandler) Deletecategory(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "handler",
		"func":   "DeleteCategory()",
		"method": c.Request.Method,
	}
	categoryId := c.Param("category_id")
	if categoryId == "" {
		logger.LogError(logFields, "Category Id empty", "c.ShouldBindJSON()", errors.New("Product Id empty"))
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	err := ch.CategoryUsecase.DeleteCategory(c.Request.Context(), categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Category not found")
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		logger.LogError(logFields, "Failed Delete Category", "ch.CategoryUsecase.DeleteCategory()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, nil, "Success Delete Category", http.StatusOK)
}

func (ch *categoryHandler) GetCategoryById(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "handler",
		"func":   "GetCategoryById()",
		"method": c.Request.Method,
	}
	categoryId := c.Param("category_id")
	if categoryId == "" {
		logger.LogError(logFields, "Category Id empty", "c.ShouldBindJSON()", errors.New("Product Id empty"))
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	result, err := ch.CategoryUsecase.GetCategoryById(c.Request.Context(), categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Category not found")
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		logger.LogError(logFields, "Failed Get Category", "ch.CategoryUsecase.GetCategoryById()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Get Category", http.StatusOK)
}

func (ch *categoryHandler) GetAllCategory(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "handler",
		"func":   "GetAllCategory()",
		"method": c.Request.Method,
	}

	result, err := ch.CategoryUsecase.GetAllCategory(c.Request.Context())
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Category not found")
			utils.ResponseError(c, http.StatusNotFound, "Category not found")
			return
		}
		logger.LogError(logFields, "Failed Get Category", "ch.CategoryUsecase.GetAllCategory()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Get Category", http.StatusOK)
}
