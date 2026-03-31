import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/core/providers/QueryProvider";
import SessionProvider from "@/core/providers/SessionProvider";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "GNEXA | Future Commerce",
    description: "Experience the next generation of e-commerce",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${spaceGrotesk.className} antialiased min-h-screen flex flex-col bg-background text-foreground`}
            >
                <SessionProvider>
                    <QueryProvider>{children}</QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
