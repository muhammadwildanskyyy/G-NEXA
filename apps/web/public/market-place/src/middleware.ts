import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
    // `withAuth` augments your `Request` with the user's token.
    function middleware(req) {
        // console.log("Middleware Token:", req.nextauth.token);
        if (!req.nextauth.token) {
            console.log("Middleware: No token found, redirecting to login.");
        } else {
            // console.log("Middleware: Token found.");
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                if (token) {
                    // console.log("Middleware: Token is valid.");
                    return true;
                }

                return false;
            },
        },
        pages: {
            signIn: "/login",
        },
        secret: process.env.NEXTAUTH_SECRET, // Explicitly pass secret
    },
);

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = req.nextUrl;

    // 🔒 Kalau belum login dan akses dashboard → redirect ke "/"
    if (!token && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // 🔁 Kalau sudah login dan akses "/" → redirect ke dashboard
    if (token && pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = { matcher: ["/dashboard", "/profile"] };
