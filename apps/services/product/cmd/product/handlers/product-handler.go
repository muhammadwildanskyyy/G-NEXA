package handlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"product-service/cmd/product/usecases"
	"product-service/infrastructure/logger"
	"product-service/model"
	"product-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProductHandler interface {
	CreateProduct(c *gin.Context)
	UpdateProduct(c *gin.Context)
	DeleteProduct(c *gin.Context)
	GetProductByID(c *gin.Context)
	GetProductInfo(c *gin.Context)
	GetAllProductsByCategoryId(c *gin.Context)
	CreateProductBulk(c *gin.Context)
}

type producthandler struct {
	ProductUseCase usecases.ProductUsecase
}

func NewProductHandler(productUseCase usecases.ProductUsecase) ProductHandler {
	return &producthandler{productUseCase}
}

func (p *producthandler) CreateProduct(c *gin.Context) {
	ctx := c.Request.Context()
	var param *model.CreateProductRequest

	if err := c.ShouldBindJSON(&param); err != nil {
		logger.Warn(ctx, "delivery:http", "Product creation denied: Invalid request body", nil)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	token, _ := c.Get("access_token")
	ctx = context.WithValue(ctx, "access_token", token)

	result, err := p.ProductUseCase.CreateProduct(ctx, param)
	if err != nil {
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Product created successfully response sent", logrus.Fields{"product_id": result.ID})
	utils.ResponseSuccess(c, result, "Success Create Product", http.StatusCreated)
}

func (p *producthandler) UpdateProduct(c *gin.Context) {
	ctx := c.Request.Context()
	productId := c.Param("product_id")

	if productId == "" {
		logger.Warn(ctx, "delivery:http", "Product update denied: Missing product_id parameter", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	var param *model.UpdateProductRequest
	if err := c.ShouldBindJSON(&param); err != nil {
		logger.Warn(ctx, "delivery:http", "Product update denied: Invalid request body", nil)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := p.ProductUseCase.UpodateProduct(ctx, param, productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Product update failed: Product not found", logrus.Fields{"product_id": productId})
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Product update response sent", logrus.Fields{"product_id": productId})
	utils.ResponseSuccess(c, result, "Success Update Product", http.StatusOK)
}

func (p *producthandler) DeleteProduct(c *gin.Context) {
	ctx := c.Request.Context()
	productId := c.Param("product_id")

	if productId == "" {
		logger.Warn(ctx, "delivery:http", "Product deletion denied: Missing product_id", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	err := p.ProductUseCase.DeleteProduct(ctx, productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Product deletion failed: Product not found", logrus.Fields{"product_id": productId})
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Product deletion response sent", logrus.Fields{"product_id": productId})
	utils.ResponseSuccess(c, nil, "Success Delete Product", http.StatusOK)
}

func (p *producthandler) GetProductByID(c *gin.Context) {
	ctx := c.Request.Context()
	productId := c.Param("product_id")

	result, err := p.ProductUseCase.GetProductByID(ctx, productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Product retrieval: Product not found", logrus.Fields{"product_id": productId})
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Silent success for read operations
	utils.ResponseSuccess(c, result, "Success Get Product", http.StatusOK)
}

func (p *producthandler) GetProductInfo(c *gin.Context) {
	ctx := c.Request.Context()
	var params model.ProductQueryParam

	if err := c.ShouldBindQuery(&params); err != nil {
		logger.Warn(ctx, "delivery:http", "Products retrieval: Invalid query parameters", nil)
		utils.ResponseError(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	result, err := p.ProductUseCase.GetProducts(ctx, &params)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Products retrieval: No products found", nil)
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.ResponseSuccess(c, result, "Success Get Products", http.StatusOK)
}

func (p *producthandler) GetAllProductsByCategoryId(c *gin.Context) {
	ctx := c.Request.Context()
	categoryId := c.Param("category_id")

	if categoryId == "" {
		logger.Warn(ctx, "delivery:http", "Products by category retrieval denied: Missing category_id", nil)
		utils.ResponseError(c, http.StatusBadRequest, "CategoryId is required")
		return
	}

	result, err := p.ProductUseCase.SelectProductsByCategoryId(ctx, categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Warn(ctx, "delivery:http", "Products by category retrieval: No documents found", logrus.Fields{"category_id": categoryId})
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.ResponseSuccess(c, result, "Success Get Products", http.StatusOK)
}

func (h *producthandler) CreateProductBulk(c *gin.Context) {
	ctx := c.Request.Context()
	var input []*model.CreateProductRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		logger.Warn(ctx, "delivery:http", "Bulk product creation denied: Invalid JSON array format", nil)
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid JSON format. Ensure you send an Array [].",
		})
		return
	}

	result, err := h.ProductUseCase.CreateProductBulk(ctx, input)
	if err != nil {
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	logger.Info(ctx, "delivery:http", "Bulk product creation response sent", logrus.Fields{"count": len(result)})
	msg := fmt.Sprintf("Bulk process successful. Saved: %d", len(result))
	utils.ResponseSuccess(c, result, msg, http.StatusCreated)
}
