package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Dimensions struct {
	Length int `bson:"length" json:"length" binding:"required,gt=0"`  // cm
	Width  int `bson:"width" json:"width"  binding:"required,gt=0"`   // cm
	Height int `bson:"height" json:"height"  binding:"required,gt=0"` // cm
}

type Variant struct {
	Name  string `bson:"name" json:"name"`
	Price int64  `bson:"price" json:"price"`
	Stock int    `bson:"stock" json:"stock"`
	SKU   string `bson:"sku" json:"sku"`
}

type Product struct {
	ID         primitive.ObjectID  `bson:"_id,omitempty" json:"id" binding:"required"`
	StoreID    string              `bson:"store_id" json:"store_id" binding:"required"`
	CategoryID *primitive.ObjectID `bson:"category_id" json:"category_id" binding:"required"`

	// --- Basic Info ---
	Name        string `bson:"name" json:"name" binding:"required"`
	Slug        string `bson:"slug" json:"slug"`
	Description string `bson:"description" json:"description" binding:"required"`
	Condition   string `bson:"condition" json:"condition" binding:"required"`

	// --- Pricing & Inventory ---
	Price    int64 `bson:"price" json:"price" binding:"required" `
	Stock    int   `bson:"stock" json:"stock" binding:"required"`
	IsActive bool  `bson:"is_active" json:"is_active" binding:"required"`

	// --- Shipping Info
	Weight     int        `bson:"weight" json:"weight" binding:"required"` // dalam Gram
	Dimensions Dimensions `bson:"dimensions" json:"dimensions" binding:"required"`

	// --- Visuals ---
	Images    []string `bson:"images" json:"images" binding:"required"`
	Thumbnail string   `bson:"thumbnail" json:"thumbnail" binding:"required"`

	// --- THE DYNAMIC PART 🚀 ---
	Specs map[string]interface{} `bson:"specs" json:"specs" binding:"required"`

	// --- Metadata ---
	Tags      []string  `bson:"tags" json:"tags"` // Untuk search keyword
	Views     int64     `bson:"views" json:"views"`
	Rating    float64   `bson:"rating" json:"rating"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type CreateProductRequest struct {
	StoreID    string `bson:"store_id" json:"store_id" binding:"required"`
	CategoryID string `bson:"category_id" json:"category_id" binding:"required"`

	// --- Basic Info ---
	Name        string `bson:"name" json:"name" binding:"required,max=50" `
	Slug        string `bson:"slug" json:"slug" binding:"required,max=50"`
	Description string `bson:"description" json:"description" binding:"required"`
	Condition   string `bson:"condition" json:"condition" binding:"required"`

	// --- Pricing & Inventory ---
	Price    int64 `bson:"price" json:"price" binding:"required,gt=0"`
	Stock    int   `bson:"stock" json:"stock" binding:"required,gt=0"`
	IsActive bool  `bson:"is_active" json:"is_active"`

	// --- Shipping Info
	Weight     int        `bson:"weight" json:"weight" binding:"required,gt=0"`
	Dimensions Dimensions `bson:"dimensions" json:"dimensions" binding:"required"`

	// --- Visuals ---
	Images    []string `bson:"images" json:"images" binding:"required"`
	Thumbnail string   `bson:"thumbnail" json:"thumbnail" binding:"required"`

	// --- THE DYNAMIC PART 🚀 ---
	Specs map[string]interface{} `bson:"specs" json:"specs" binding:"required"`

	// --- Metadata ---
	Tags []string `bson:"tags" json:"tags" binding:"required"`
}

type UpdateProductRequest struct {
	StoreID    string `bson:"store_id" json:"store_id" binding:"required"`
	CategoryID string `bson:"category_id" json:"category_id" binding:"required"`

	// --- Basic Info ---
	Name        string `bson:"name" json:"name" binding:"required,max=50" `
	Slug        string `bson:"slug" json:"slug" binding:"required,max=15"`
	Description string `bson:"description" json:"description" binding:"required"`
	Condition   string `bson:"condition" json:"condition" binding:"required"`

	// --- Pricing & Inventory ---
	Price    int64 `bson:"price" json:"price" binding:"required,gt=0"`
	Stock    int   `bson:"stock" json:"stock" binding:"required,gt=0"`
	IsActive bool  `bson:"is_active" json:"is_active"`

	// --- Shipping Info
	Weight     int        `bson:"weight" json:"weight" binding:"required,gt=0"`
	Dimensions Dimensions `bson:"dimensions" json:"dimensions" binding:"required"`

	// --- Visuals ---
	Images    []string `bson:"images" json:"images" binding:"required"`
	Thumbnail string   `bson:"thumbnail" json:"thumbnail" binding:"required"`

	// --- THE DYNAMIC PART 🚀 ---
	Specs map[string]interface{} `bson:"specs" json:"specs" binding:"required"`

	// --- Metadata ---
	Tags []string `bson:"tags" json:"tags" binding:"required"`
}

type ProductQueryParam struct {
	// Pagination
	Page  int64 `json:"page" form:"page"`
	Limit int64 `json:"limit" form:"limit"`

	//search and filter
	Search     string  `json:"search" form:"search"`
	CategoryID string  `json:"category_id" form:"category_id"`
	StoreID    string  `json:"store_id" form:"store_id"`
	Condition  string  `json:"condition" form:"condition"`
	MinPrice   float64 `json:"min_price" form:"min_price"`
	MaxPrice   float64 `json:"max_price" form:"max_price"`
	SortBy     string  `json:"sort_by" form:"sort_by"`
}

type PaginationProductResult struct {
	Products  []*Product `json:"products"`
	TotalData int64      `json:"total_data"`
	TotalPage int64      `json:"total_page"`
	Page      int64      `json:"page"`
	Limit     int64      `json:"limit"`
}
