import { withAuth } from "next-auth/middleware"

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
            signIn: '/auth/login',
        },
        secret: process.env.NEXTAUTH_SECRET, // Explicitly pass secret
    }
)

export const config = { matcher: ["/dashboard", "/user-profile"] }
