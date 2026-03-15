import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productRepository } from '@/infrastructure/repositories/productRepository';
import { ProductFilter } from '@/domain/models/Product';

export const useProducts = (filters?: ProductFilter) => {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: () => productRepository.getProducts(filters),
        placeholderData: keepPreviousData, // Keep previous data while fetching new page
    });
};

export const useProduct = (id: string) => {
    return useQuery({
        queryKey: ['product', id],
        queryFn: () => productRepository.getProduct(id),
        enabled: !!id,
    });
};
