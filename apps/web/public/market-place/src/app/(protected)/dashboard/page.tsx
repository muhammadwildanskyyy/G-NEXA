"use client";

import { useProducts } from "@/core/hooks/useProducts";
import ProductCard from "@/presentation/features/catalog/product/ProductCard";
import { ProductFilter } from "@/presentation/features/catalog/product/ProductFilter";
import { Button } from "@/presentation/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/presentation/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { ProductFilter as ProductFilterModel } from "@/domain/models/Product";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/presentation/components/ui/sheet";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function HomePage() {
    const [filters, setFilters] = useState<ProductFilterModel>({
        page: 1,
        limit: 8,
        sort_by: "views", // Changed default to 'views' (Popular) or could be 'latest'
        min_price: 0,
        max_price: 0,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const { data: response, isLoading, error } = useProducts(filters);

    // Handle case where API returns array directly vs formatted response
    const products = Array.isArray(response) ? response : response?.data || [];
    const totalPages = !Array.isArray(response) ? response?.totalPages || 1 : 1;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (newFilters: ProductFilterModel) => {
        setFilters(newFilters);
    };

    const clearFilters = () => {
        setFilters({
            page: 1,
            limit: 8,
            sort_by: "views",
            min_price: 0,
            max_price: 0,
            search: "",
        });
        setSearchTerm("");
    };

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Hero Section */}
            <section className="bg-linear-to-r from-primary/10 via-primary/5 to-background py-16 px-4 mb-8">
                <div className="container mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                        Welcome to <span className="text-primary">GNEXA</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        The next generation marketplace built with microservices
                        architecture. Experience speed, security, and
                        scalability.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" asChild>
                            <Link href="#products">Shop Now</Link>
                        </Button>
                        <Button size="lg" variant="outline">
                            Learn More
                        </Button>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4" id="products">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24">
                            <ProductFilter
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={clearFilters}
                            />
                        </div>
                    </aside>

                    {/* Mobile Filter Sheet */}
                    <Sheet
                        open={isMobileFilterOpen}
                        onOpenChange={setIsMobileFilterOpen}
                    >
                        <SheetContent
                            side="left"
                            className="w-[300px] sm:w-[400px] overflow-y-auto"
                        >
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>
                                    Refine your product search.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-4">
                                <ProductFilter
                                    filters={filters}
                                    onFilterChange={(f) => {
                                        handleFilterChange(f);
                                    }}
                                    onClearFilters={clearFilters}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Search and Mobile Filter Trigger */}
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                            <div className="flex items-center gap-2 w-full sm:w-auto lg:hidden">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsMobileFilterOpen(true)}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filters
                                </Button>
                            </div>

                            <div className="flex-1 w-full sm:w-auto flex justify-end">
                                <form
                                    onSubmit={handleSearch}
                                    className="flex gap-2 w-full sm:w-[400px]"
                                >
                                    <div className="relative w-full">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search products..."
                                            className="pl-8 w-full"
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        search: "",
                                                        page: 1,
                                                    }));
                                                }}
                                                className="absolute right-2.5 top-2.5"
                                            >
                                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        )}
                                    </div>
                                    <Button type="submit">Search</Button>
                                </form>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-[400px] rounded-xl bg-muted animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                                <h2 className="text-2xl font-bold text-destructive mb-2">
                                    Error loading products
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    Could not connect to the product service.
                                </p>
                                <Button
                                    onClick={() => window.location.reload()}
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : products && products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                        />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-8">
                                        <Button
                                            variant="outline"
                                            disabled={filters.page === 1}
                                            onClick={() =>
                                                handlePageChange(
                                                    (filters.page || 1) - 1,
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <span className="flex items-center px-4 font-medium text-sm">
                                            Page {filters.page} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            disabled={
                                                filters.page === totalPages
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    (filters.page || 1) + 1,
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 border border-dashed rounded-xl bg-muted/10">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                                    <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">
                                    No products found
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    We couldn't find any products matching your
                                    current filters. Try adjusting your search
                                    or clearing filters.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
