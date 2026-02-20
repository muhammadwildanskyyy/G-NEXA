package model

import "time"

type StoreResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	IsVerified  bool      `json:"is_verified"`
	LogoURL     string    `json:"logo_url"`
	CoverURL    string    `json:"cover_url"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	Province    string    `json:"province"`
	PostalCode  string    `json:"postal_code"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	UserID      string    `json:"user_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
