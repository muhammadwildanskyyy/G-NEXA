import { useMutation } from '@tanstack/react-query';
import { mediaRepository } from '@/infrastructure/repositories/mediaRepository';

export const useUploadMedia = () => {
    return useMutation({
        mutationFn: mediaRepository.upload,
    });
};
