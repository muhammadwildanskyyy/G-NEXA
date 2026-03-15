import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
    AuthError,
    NetworkError,
    NotFoundError,
} from "@/domain/errors/AppErrors";
import { getSession } from "next-auth/react";

// Helper to create instances for different services
const createApiClient = (baseURL: string) => {
    const api = axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Request Interceptor (Add Token)
    api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        if (typeof window !== "undefined") {
            // Client-side: Get session from NextAuth
            const session = await getSession();
            const token = (session as any)?.accessToken;

            if (token && config.headers) {
                config.headers.set("Authorization", `Bearer ${token}`);
            }
        }
        return config;
    });

    // Response Interceptor (Error Handling)
    api.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (!error.response) {
                return Promise.reject(new NetworkError());
            }

            const status = error.response.status;
            const data = error.response.data as any;
            const backendMessage = data?.meta?.message || data?.message;

            if (backendMessage) {
                // If the backend provides a specific message, use it.
                return Promise.reject(new Error(backendMessage));
            }

            if (status === 401) {
                // console.warn('Unauthorized access', error.config?.url);
                return Promise.reject(new AuthError());
            }

            if (status === 404) {
                return Promise.reject(new NotFoundError("Resource"));
            }

            return Promise.reject(error);
        },
    );

    return api;
};

export const userServiceApi = createApiClient("http://user-service:8081");
export const productServiceApi = createApiClient("http://localhost:8082");
