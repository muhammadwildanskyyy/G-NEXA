import { userServiceApi } from '@/infrastructure/api/axios';
import { User } from '@/domain/models/User';
import {
    ApiResponse,
    LoginRequest,
    LoginResponseData,
    RegisterRequest,
    RegisterResponseData,
    UpdateProfileRequest
} from '@/domain/models/Auth';

export const authRepository = {
    login: async (credentials: LoginRequest): Promise<LoginResponseData> => {
        const response = await userServiceApi.post<ApiResponse<LoginResponseData>>('/v1/auth/login', credentials);
        return response.data.data;
    },

    register: async (data: RegisterRequest): Promise<RegisterResponseData> => {
        const response = await userServiceApi.post<ApiResponse<RegisterResponseData>>('/v1/auth/register', data);
        return response.data.data;
    },

    getProfile: async (): Promise<User> => {
        const response = await userServiceApi.get<ApiResponse<User>>('/v1/api/users/me');
        return response.data.data;
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        const response = await userServiceApi.put<ApiResponse<User>>('/v1/api/users/update-user', data);
        return response.data.data;
    }
};
