import { productServiceApi } from '@/infrastructure/api/axios';
import { Product, ProductFilter, ProductListResponse, Category } from '@/domain/models/Product';

export const productRepository = {
    getProducts: async (filters?: ProductFilter): Promise<ProductListResponse> => {
        const params = new URLSearchParams();

        if (filters) {
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.search) params.append('search', filters.search);
            if (filters.condition) params.append('condition', filters.condition);
            if (filters.min_price) params.append('min_price', filters.min_price.toString());
            if (filters.max_price && filters.max_price > 0) params.append('max_price', filters.max_price.toString());
            if (filters.sort_by) params.append('sort_by', filters.sort_by);
            if (filters.category_id) params.append('category_id', filters.category_id);
        }

        const response = await productServiceApi.get<any>(`/v1/products?${params.toString()}`);

        const responseData = response.data?.data;
        if (responseData && Array.isArray(responseData.products)) {
            return {
                data: responseData.products,
                total: responseData.total_data,
                page: responseData.page,
                limit: responseData.limit,
                totalPages: responseData.total_page
            };
        }

        // Fallback or empty
        return {
            data: [],
            total: 0,
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            totalPages: 1
        };
    },

    getProduct: async (id: string): Promise<Product> => {
        const response = await productServiceApi.get<any>(`/v1/product/${id}`);
        // Handle potential nested data structure like list response
        return response.data?.data || response.data;
    },

    getCategories: async (): Promise<Category[]> => {
        const response = await productServiceApi.get<any>('/v1/categories');
        return response.data?.data || [];
    }
};
