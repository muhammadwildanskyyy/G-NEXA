export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    categoryId?: string;
    createdAt: string;
    updatedAt: string;
    condition?: 'new' | 'used';
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProductFilter {
    page?: number;
    limit?: number;
    search?: string;
    condition?: 'new' | 'used';
    min_price?: number;
    max_price?: number;
    sort_by?: 'price_asc' | 'price_desc' | 'latest' | 'oldest' | 'views';
    category_id?: string;
}

export interface ProductListResponse {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
