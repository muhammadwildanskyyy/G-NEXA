package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AttributeTemplate struct {
	Key      string   `bson:"key" json:"key"`     // e.g., "screen_size"
	Label    string   `bson:"label" json:"label"` // e.g., "Ukuran Layar"
	Type     string   `bson:"type" json:"type"`   // e.g., "text", "number", "dropdown"
	Required bool     `bson:"required" json:"required"`
	Options  []string `bson:"options,omitempty" json:"options,omitempty"` // Jika dropdown
}

type Category struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Name      string              `bson:"name" json:"name"`
	Slug      string              `bson:"slug" json:"slug"`
	ParentID  *primitive.ObjectID `bson:"parent_id,omitempty" json:"parent_id"` // Pointer agar bisa null (root category)
	Templates []AttributeTemplate `bson:"templates" json:"templates"`           // Definisi atribut
	CreatedAt time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time           `bson:"updated_at" json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name      string              `bson:"name" json:"name" binding:"required"`
	Slug      string              `bson:"slug" json:"slug" binding:"required"`
	ParentID  *primitive.ObjectID `bson:"parent_id,omitempty" json:"parent_id" `
	Templates []AttributeTemplate `bson:"templates" json:"templates" binding:"required"`
}

/*
{
    "_id": ObjectId("CAT_LAPTOP_01"),
    "name": "Laptop Gaming",
    "templates": [
        {
            "key": "processor",
            "label": "Tipe Processor",
            "type": "dropdown",     // UI harus render Dropdown
            "required": true,       // Wajib diisi
            "options": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"]
        },
        {
            "key": "ram",
            "label": "Kapasitas RAM",
            "type": "number",       // UI harus render input angka
            "suffix": "GB",         // Satuan
            "required": true
        },
        {
            "key": "backlit_keyboard",
            "label": "Lampu Keyboard",
            "type": "boolean",      // UI harus render Checkbox/Switch
            "required": false
        }
    ]
}
*/
