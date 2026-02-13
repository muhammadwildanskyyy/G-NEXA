import axios from 'axios';
import { NetworkError, AuthError } from '@/domain/errors/AppErrors';
import { getSession } from 'next-auth/react';

// Media Service Client
export const mediaServiceApi = axios.create({
    baseURL: '/api/media-service', // Proxied via Next.js to http://localhost:8083/api/v1
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

mediaServiceApi.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        const session = await getSession();
        const token = (session as any)?.accessToken;
        if (token && config.headers) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }
    }
    return config;
});

mediaServiceApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) return Promise.reject(new NetworkError());
        if (error.response.status === 401) return Promise.reject(new AuthError());
        return Promise.reject(error);
    }
);

export interface UploadResponse {
    data: {
        ID: string;
        FileName: string;
        FileURL: string;
        PublicID: string;
        MediaType: string;
        CreatedAt: string;
        UpdatedAt: string;
    };
    meta: {
        code: number;
        message: string;
    };
}

export const mediaRepository = {
    upload: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await mediaServiceApi.post<UploadResponse>('/media/upload', formData);
        return response.data;
    }
};
