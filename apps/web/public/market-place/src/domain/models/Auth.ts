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
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
}

export interface RegisterResponseData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileRequest {
    fullName?: string;
    phoneNumber?: string;
    profilePicture?: string;
    bio?: string;
}
