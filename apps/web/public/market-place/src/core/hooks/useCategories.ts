import { useQuery } from '@tanstack/react-query';
import { productRepository } from '@/infrastructure/repositories/productRepository';
import { Category } from '@/domain/models/Product';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => productRepository.getCategories(),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
};
