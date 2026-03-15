import { Product } from "@/domain/models/Product";

interface ProductCardProps {
    product: Product;
}
export default function ProductCard({ product }: ProductCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="bg-surface-dark border border-border-dark group hover:border-primary transition-colors">
            <div className="relative aspect-[3/4] overflow-hidden">
                <img
                    src="/images/product.webp"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[10px] font-black py-2 text-center translate-y-full group-hover:translate-y-0 transition-transform uppercase tracking-widest">
                    Quick Add to Cart
                </div>
            </div>

            <div className="p-4">
                <p className="text-primary text-[9px] font-black uppercase tracking-widest mb-1">
                    Ghost Tech
                </p>

                <h3 className="text-white text-sm font-black uppercase mb-3 italic">
                    Ghost 60% Linear White
                </h3>

                <span className="text-white text-lg font-black">$159.00</span>
            </div>
        </div>
    );
}
