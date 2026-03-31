import { useUser } from "@/core/hooks/useAuth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "GNEXA | Login",
    description: "Experience the next generation of e-commerce",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <aside className="relative w-full md:w-1/2">
                <img
                    src="/images/hero-auth.png"
                    alt="Auth Image"
                    className="w-full h-64 md:h-screen object-cover"
                />

                {/* gradient overlay (mobile only) */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent md:hidden" />
            </aside>

            <main className="w-full md:w-1/2 flex items-center justify-center">
                {children}
            </main>
        </div>
    );
}
