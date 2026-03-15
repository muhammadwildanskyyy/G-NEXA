import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authRepository } from "@/infrastructure/repositories/authRepository";
import { LoginRequest } from "@/domain/models/Auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("LOGIN HIT", credentials);

                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const loginData: LoginRequest = {
                        email: credentials.email,
                        password: credentials.password,
                    };

                    const response = await authRepository.login(loginData);
                    console.log("SIGNIN RESULT:", response);

                    if (response && response.token) {
                        // Return user object with token
                        // We will map this to the session in the callbacks
                        return {
                            id: "current-user", // Placeholder, we might need to fetch profile or get ID from login response if available
                            email: loginData.email,
                            accessToken: response.token,
                        } as any;
                    }
                    return null;
                } catch (error: any) {
                    // console.log("Login Error:", error.message);
                    throw new Error(error.message || "Authentication failed");
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
};
