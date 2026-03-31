import Footer from "@/presentation/features/layout/Footer";
import Header from "@/presentation/features/layout/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "GNEXA | Get better with your accesories",
    description: "Experience the next generation of e-commerce",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
