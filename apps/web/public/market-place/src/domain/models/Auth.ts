import { User } from "./User";

export interface ApiResponse<T> {
    meta: {
        message: string;
        status: number;
        code?: number;
    };
    data: T;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponseData {
    token: string;
}

export interface RegisterRequest {
    full_name: string;
    email: string;
    password: string;
    phone_number: string;
}

export interface RegisterResponseData {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone_number: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateProfileRequest {
    full_name?: string;
    phone_number?: string;
    profile_picture?: string;
    bio?: string;
}
