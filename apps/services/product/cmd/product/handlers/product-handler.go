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
	logFields := logrus.Fields{
		"layer":  "product-handler",
		"func":   "CreateProduct",
		"method": c.Request.Method,
	}
	var param *model.CreateProductRequest
	err := c.ShouldBindJSON(&param)
	if err != nil {
		logger.LogError(logFields, "Failed Validate Request", "c.ShouldBindJSON()", err)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}
	token, _ := c.Get("access_token")
	ctx := context.WithValue(c.Request.Context(), "access_token", token)
	result, err := p.ProductUseCase.CreateProduct(ctx, param)
	if err != nil {
		logger.LogError(logFields, "Failed CreateProduct", "p.ProductUseCase.CreateProduct()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.ResponseSuccess(c, result, "Success Create Poduct", http.StatusCreated)

}

func (p *producthandler) UpdateProduct(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "product-handler",
		"func":   "UpdateProduct()",
		"method": c.Request.Method,
	}

	var param *model.UpdateProductRequest
	err := c.ShouldBindJSON(&param)
	if err != nil {
		logger.LogError(logFields, "Failed Validate Request", "c.ShouldBindJSON()", err)
		utils.ResponseError(c, http.StatusBadRequest, err.Error())
		return
	}

	productId := c.Param("product_id")
	if productId == "" {
		logger.LogError(logFields, "Product Id empty", "c.ShouldBindJSON()", errors.New("Product Id empty"))
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	result, err := p.ProductUseCase.UpodateProduct(c.Request.Context(), param, productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Product not found")
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		logger.LogError(logFields, "Failed UpdateProduct", "p.ProductUseCase.UpdateProduct()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Update Poduct", http.StatusOK)
}

func (p *producthandler) DeleteProduct(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":      "product-handler",
		"func":       "DeleteProduct()",
		"method":     c.Request.Method,
		"product_id": c.Param("product_id"),
	}
	productId := c.Param("product_id")
	if productId == "" {
		logger.LogError(logFields, "Product id is empty", "c.Param()", errors.New("Product Id is empty"))
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}

	err := p.ProductUseCase.DeleteProduct(c.Request.Context(), productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Product not found")
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		logger.LogError(logFields, "Failed DeleteProduct", "p.ProductUseCase.DeleteProduct()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
	}
	utils.ResponseSuccess(c, nil, "Success Delete Poduct", http.StatusOK)

}

func (p *producthandler) GetProductByID(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":      "product-handler",
		"func":       "GetProductByID()",
		"method":     c.Request.Method,
		"product_id": c.Param("product_id"),
	}
	productId := c.Param("product_id")
	if productId == "" {
		logger.LogError(logFields, "Product Id is empty", "c.Param()", errors.New("Product Id is empty"))
		utils.ResponseError(c, http.StatusBadRequest, "Product Id is required")
		return
	}
	result, err := p.ProductUseCase.GetProductByID(c.Request.Context(), productId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Product not found")
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		logger.LogError(logFields, "Failed GetProductByID", "productId", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Get Poduct", http.StatusOK)
}

func (p *producthandler) GetProductInfo(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "product-handler",
		"func":   "GetProductInfo()",
		"method": c.Request.Method,
	}

	// 1. Bind Query Parameter otomatis (Page, Limit, Search, Filter)
	var params model.ProductQueryParam
	if err := c.ShouldBindQuery(&params); err != nil {
		utils.ResponseError(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	// 2. Panggil Usecase
	result, err := p.ProductUseCase.GetProducts(c.Request.Context(), &params)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Product not found")
			// Bisa return empty list [] daripada 404, tapi 404 juga oke
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		logger.LogError(logFields, "Failed GetProductInfo", "p.ProductUseCase.GetProducts()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.ResponseSuccess(c, result, "Success Get Products", http.StatusOK)
}

func (p *producthandler) GetAllProductsByCategoryId(c *gin.Context) {
	logFields := logrus.Fields{
		"layer":  "product-handler",
		"func":   "GetAllProductsByCategoryId()",
		"method": c.Request.Method,
	}

	categoryId := c.Param("category_id")
	if categoryId == "" {
		logger.LogError(logFields, "CategoryId is empty", "c.Param()", errors.New("CategoryId is empty"))
		utils.ResponseError(c, http.StatusBadRequest, "CategoryId is required")
		return
	}

	result, err := p.ProductUseCase.SelectProductsByCategoryId(c.Request.Context(), categoryId)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Log.WithFields(logFields).Warn("Product not found")
			utils.ResponseError(c, http.StatusNotFound, "Product not found")
			return
		}
		logger.LogError(logFields, "Failed Select Products By Category Id", "p.ProductUseCase.SelectProductsByCategoryId()", err)
		utils.ResponseError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.ResponseSuccess(c, result, "Success Get Products", http.StatusOK)
}

func (h *producthandler) CreateProductBulk(c *gin.Context) {
	// Perhatikan: Variable ini adalah SLICE (Array)
	var input []*model.CreateProductRequest

	// 1. Bind JSON Array
	if err := c.ShouldBindJSON(&input); err != nil {
		// Error jika format JSON bukan Array atau tipe data salah
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Format JSON salah. Pastikan mengirim Array []. Detail: " + err.Error(),
		})
		return
	}

	// 2. Panggil Service
	result, err := h.ProductUseCase.CreateProductBulk(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// 3. Response Sukses
	msg := fmt.Sprintf("Berhasil memproses bulk insert. Data tersimpan: %d", len(result))
	utils.ResponseSuccess(c, result, msg, http.StatusCreated)
}
