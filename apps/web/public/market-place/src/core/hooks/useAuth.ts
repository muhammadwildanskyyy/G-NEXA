"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@/infrastructure/repositories/authRepository";

// useLogin now wraps NextAuth signIn
export const useLogin = () => {
    return useMutation({
        mutationFn: async (credentials: any) => {
            const result = await signIn("credentials", {
                redirect: false,
                email: credentials.email,
                password: credentials.password,
            });

            if (result?.error) {
                throw new Error(result.error);
            }
            return result;
        },
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: authRepository.register,
    });
};

// useUser now fetches the full profile from the backend using the token
export const useUser = () => {
    const { data: session, status } = useSession();
    const token = (session as any)?.accessToken;

    const {
        data: userProfile,
        isLoading: isProfileLoading,
        error,
    } = useQuery({
        queryKey: ["user", token],
        queryFn: async () => {
            if (!token) return null;
            return await authRepository.getProfile();
        },
        enabled: status === "authenticated" && !!token,
        retry: false,
    });

    const isLoading =
        status === "loading" ||
        (status === "authenticated" && isProfileLoading);
    const isAuthenticated = status === "authenticated";

    // Use session user as fallback if profile fetch fails or while loading, but profile is preferred
    const user = userProfile || (session?.user as any) || null;

    return {
        data: user,
        isLoading,
        isAuthenticated,
        error,
    };
};

export const useLogout = () => {
    return () => signOut({ callbackUrl: "/" });
};

export const useUpdateProfile = () => {
    const { update } = useSession();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authRepository.updateProfile,
        onSuccess: async (newUser) => {
            // Update NextAuth session if possible, or just invalidate queries
            // Updating session in NextAuth with Credentials provider is tricky without triggering a jwt refresh
            // For now, let's just invalidate query if we were using useQuery for profile
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
};
