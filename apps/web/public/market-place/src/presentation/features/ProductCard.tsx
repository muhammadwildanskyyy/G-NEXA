import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Product } from '@/domain/models/Product';
import { Badge } from '@/presentation/components/ui/badge';

interface ProductCardProps {
    product: Product;
}

// Temporary Badge component until I make the real one in ui/badge.tsx
// Or I can just omit it for now, but better to create it.
// I'll create a simple inline badge style for now or I should create ui/badge.tsx.
// Let's assume ui/badge exists or remove it. I'll remove it for now to avoid errors, or create it.
// I'll create it in next step. For now, comment out Badge.

export default function ProductCard({ product }: ProductCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-square relative bg-muted flex items-center justify-center text-muted-foreground">
                {/* Placeholder for Image */}
                {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                    <span className="text-4xl font-bold opacity-20">GNEXA</span>
                )}
            </div>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                        <Link href={`/product/${product.id}`}>
                            {product.name}
                        </Link>
                    </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2 h-10">
                    {product.description}
                </p>
            </CardHeader>
            <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                </span>
                <Button size="sm" className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Add
                </Button>
            </CardFooter>
        </Card>
    );
}
