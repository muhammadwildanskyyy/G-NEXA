"use client";

import { useProduct } from "@/core/hooks/useProducts";
import { Button } from "@/presentation/components/ui/button";
import { ShoppingCart, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProductDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: product, isLoading, error } = useProduct(id);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-muted aspect-square rounded-xl animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-8 bg-muted w-3/4 animate-pulse rounded" />
                        <div className="h-4 bg-muted w-1/4 animate-pulse rounded" />
                        <div className="h-24 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                <Button asChild>
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" className="mb-6 gap-2" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" /> Back to Products
                </Link>
            </Button>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                {/* Product Image */}
                <div className="aspect-square bg-muted rounded-xl overflow-hidden border">
                    {product.images?.[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50">
                            <span className="text-6xl font-bold opacity-10">
                                GNEXA
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-primary text-primary"
                                    />
                                ))}
                            </div>
                            <span className="text-sm">(4.8/5.0)</span>
                        </div>
                    </div>

                    <div className="text-3xl font-bold text-primary">
                        {formatPrice(product.price)}
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                        {product.description}
                    </p>

                    <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Availability:
                            </span>
                            <span className="font-medium text-green-600">
                                In Stock ({product.stock} units)
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Category:
                            </span>
                            <span className="font-medium capitalize">
                                {product.categoryId || "General"}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button size="lg" className="w-full gap-2 text-lg">
                            <ShoppingCart className="h-5 w-5" />
                            Add to Cart
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full text-lg"
                        >
                            Buy Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
