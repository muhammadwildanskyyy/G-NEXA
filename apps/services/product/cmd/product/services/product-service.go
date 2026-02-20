package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"product-service/cmd/product/repositories"
	"product-service/config"
	"product-service/infrastructure/logger"
	"product-service/model"
	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProductService interface {
	CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error)
	UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error)
	DeleteProduct(ctx context.Context, productId string) error
	GetProductById(ctx context.Context, productId string) (*model.Product, error)
	GetProducts(ctx context.Context, paginationParam *model.ProductQueryParam) (*model.PaginationProductResult, error)
	GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error)
	CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error)
}
type productService struct {
	ProductRepository  repositories.ProductRepository
	CategoryRepository repositories.CategoryRepository
	HostServices       config.HostServices
}

func NewProductService(productRepository repositories.ProductRepository, categoryRepository repositories.CategoryRepository, HostServices config.HostServices) ProductService {
	return &productService{
		ProductRepository:  productRepository,
		CategoryRepository: categoryRepository,
		HostServices:       HostServices,
	}
}

func (p *productService) CreateProduct(ctx context.Context, product *model.CreateProductRequest) (*model.Product, error) {

	logField := logrus.Fields{
		"layer":       "services",
		"func":        "CreateProduct()",
		"productName": product.Name,
	}

	httpClient := &http.Client{
		Timeout: time.Second * 10,
	}

	targetURL := fmt.Sprintf("http://user-service:8081/v1/api/store/%v", product.StoreID)
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		logger.LogError(logField, "Create Request to User Service failed", "http.NewRequestWithContext()", err)
		return nil, err
	}

	accessToken, ok := ctx.Value("access_token").(string)
	if !ok {
		logger.LogError(logField, "Access Token Missing", "ctx.Value()", nil)
		return nil, errors.New("access token missing from header")
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		logger.LogError(logField, "Error sending request", "httpClient.Do()", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errStatus := fmt.Errorf("upstream API returned status: %d", resp.StatusCode)
		logger.LogError(logField, "API Response Error", "StatusCheck", errStatus)
		return nil, errStatus
	}

	var store model.StoreResponse
	if err := json.NewDecoder(resp.Body).Decode(&store); err != nil {
		logger.LogError(logField, "Error parsing Response", "json.Decode", err)
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	CategoryId, err := primitive.ObjectIDFromHex(product.CategoryID)
	if err != nil {
		logger.LogError(logField, "Category Id Invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	category, err := p.CategoryRepository.SelectCategoryById(ctx, product.CategoryID)
	if err != nil {
		logger.LogError(logField, "Category Not Found", "categoryId", err)
		return nil, err
	}

	if err := p.validateProductSpecs(category, product.Specs); err != nil {
		logger.LogError(logField, "Product specs validation failed:", "p.validateProductSpecs()", err)
		return nil, err
	}

	productInput := &model.Product{
		StoreID:    store.ID,
		CategoryID: &CategoryId,

		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,

		Price:    product.Price,
		Stock:    product.Stock,
		IsActive: product.IsActive,

		Weight:     product.Weight,
		Dimensions: product.Dimensions,

		Images:    product.Images,
		Thumbnail: product.Thumbnail,

		Specs: product.Specs,

		Tags: product.Tags,
	}

	newProduct, err := p.ProductRepository.InsertProduct(ctx, productInput)
	if err != nil {
		logger.LogError(logField, "Failed to insert product", " p.ProductRepository.InsertProduct()", err)
		return nil, err
	}
	return newProduct, nil
}

func (p *productService) UpdateProduct(ctx context.Context, product *model.UpdateProductRequest, productId string) (*model.Product, error) {
	logField := logrus.Fields{
		"layer":        "services",
		"func":         "UpdateProduct()",
		"product_name": product.Name,
	}

	CategoryId, err := primitive.ObjectIDFromHex(product.CategoryID)
	if err != nil {
		logger.LogError(logField, "Category Id Invalid", "primitive.ObjectIDFromHex()", err)
		return nil, err
	}

	productInput := &model.Product{
		StoreID:    product.StoreID,
		CategoryID: &CategoryId,

		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Condition:   product.Condition,

		Price:    product.Price,
		Stock:    product.Stock,
		IsActive: product.IsActive,

		Weight:     product.Weight,
		Dimensions: product.Dimensions,

		Images:    product.Images,
		Thumbnail: product.Thumbnail,

		Specs: product.Specs,

		Tags: product.Tags,
	}
	newProduct, err := p.ProductRepository.UpdateProduct(ctx, productInput, productId)
	if err != nil {
		logger.LogError(logField, "Failed to update product", " p.ProductRepository.UpdateProduct()", err)
		return nil, err
	}
	return newProduct, nil
}

func (p *productService) DeleteProduct(ctx context.Context, productId string) error {
	logField := logrus.Fields{
		"layer":     "services",
		"func":      "DeleteProduct()",
		"productId": productId,
	}
	err := p.ProductRepository.DeleteProduct(ctx, productId)
	if err != nil {
		logger.LogError(logField, "Failed to delete product", " p.ProductRepository.DeleteProduct()", err)
		return err
	}
	return nil

}

func (p *productService) GetProductById(ctx context.Context, productId string) (*model.Product, error) {

	logField := logrus.Fields{
		"layer":     "services",
		"func":      "GetProductById()",
		"productId": productId,
	}
	product, err := p.ProductRepository.FindProductByID(ctx, productId)
	if err != nil {
		logger.LogError(logField, "Failed to get product", " p.ProductRepository.FindProductByID()", err)
		return nil, err
	}
	return product, nil
}

func (p *productService) GetProducts(ctx context.Context, params *model.ProductQueryParam) (*model.PaginationProductResult, error) {
	logField := logrus.Fields{
		"layer": "services",
		"func":  "GetProducts()",
	}

	// Default Pagination Logic
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Limit > 100 {
		params.Limit = 100
	}

	products, totalProduct, err := p.ProductRepository.FindAllProducts(ctx, params)
	if err != nil {
		logger.LogError(logField, "Failed to get products", "p.ProductRepository.FindAllProducts()", err)
		return nil, err
	}

	// Hitung Total Pages
	totalPages := int64(math.Ceil(float64(totalProduct) / float64(params.Limit)))

	result := &model.PaginationProductResult{
		Products:  products,
		TotalData: totalProduct,
		TotalPage: totalPages,
		Page:      params.Page,
		Limit:     params.Limit,
	}
	return result, nil
}

func (p *productService) GetProductsByCategoryId(ctx context.Context, categoryId string) ([]*model.Product, error) {

	logField := logrus.Fields{
		"layer":      "services",
		"func":       "GetProductsByCategoryId()",
		"categoryId": categoryId,
	}

	result, err := p.ProductRepository.SelectProductsByCategoryId(ctx, categoryId)
	if err != nil {
		logger.LogError(logField, "Failed to get products by Category Id", " p.ProductRepository.SelectProductsByCategoryId()", err)
		return nil, err
	}
	return result, nil
}

// Helper function untuk validasi specs
func (p *productService) validateProductSpecs(category *model.Category, inputSpecs map[string]interface{}) error {

	// Loop setiap template yang ada di Category (Misal: Brand, RAM, Storage)
	for _, template := range category.Templates {

		// Ambil value dari input user berdasarkan Key template (misal: "ram")
		value, exists := inputSpecs[template.Key]

		// 1. CEK REQUIRED (Wajib Diisi)
		if template.Required {
			// Jika key tidak ada, atau nil, atau string kosong
			if !exists || value == nil || value == "" {
				return fmt.Errorf("field spesifikasi '%s' wajib diisi", template.Label)
			}
		}

		// Jika user tidak mengisi (dan tidak required), skip validasi opsi
		if !exists || value == nil {
			continue
		}

		// 2. CEK TIPE DATA DROPDOWN (Pilihan Terbatas)
		// Jika template tipe-nya dropdown, pastikan value user ada di dalam opsi
		if template.Type == "dropdown" && len(template.Options) > 0 {
			isValidOption := false
			inputString := fmt.Sprintf("%v", value) // Konversi input user ke string biar aman

			for _, option := range template.Options {
				if option == inputString {
					isValidOption = true
					break
				}
			}

			if !isValidOption {
				return fmt.Errorf("nilai '%s' tidak valid untuk field '%s'. Pilihan: %v", inputString, template.Label, template.Options)
			}
		}
	}

	return nil
}

func (s *productService) CreateProductBulk(ctx context.Context, products []*model.CreateProductRequest) ([]*model.Product, error) {
	var successProducts []*model.Product
	var failedCount int

	for i, req := range products {

		newProduct, err := s.CreateProduct(ctx, req)

		if err != nil {

			logrus.Warnf("[BulkInsert] Gagal pada index ke-%d (Nama: %s): %v", i, req.Name, err)
			failedCount++
			continue
		}

		successProducts = append(successProducts, newProduct)
	}

	// Opsional: Log summary
	logrus.Infof("[BulkInsert] Selesai. Sukses: %d, Gagal: %d", len(successProducts), failedCount)

	return successProducts, nil
}
