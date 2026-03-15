import RatingStars from "./RatingStars";

type ProductBadge = "new" | "sale";

export interface ProductCardProps {
    name: string;
    category: string;
    price: number;
    oldPrice?: number;
    image: string;
    rating?: number;
    badge?: ProductBadge;
}

const ProductCard = ({
    name,
    category,
    price,
    oldPrice,
    image,
    rating,
    badge,
}: ProductCardProps) => {
    return (
        <div className="bg-surface-dark border border-border-dark group hover:border-primary transition-colors">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden border-b border-border-dark">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />

                {/* Badge */}
                {badge && (
                    <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">
                        {badge}
                    </span>
                )}

                {/* Add to cart */}
                <button className="absolute bottom-4 right-4 bg-white text-black p-3 translate-y-20 group-hover:translate-y-0 transition-transform">
                    🛒
                </button>
            </div>

            {/* Info */}
            <div className="p-6">
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">
                    {category}
                </p>

                <h3 className="text-white text-lg font-black italic leading-tight mb-4">
                    {name}
                </h3>

                <div className="flex items-center justify-between">
                    <div>
                        {oldPrice && (
                            <span className="text-slate-500 text-sm line-through mr-2">
                                ${oldPrice}
                            </span>
                        )}

                        <span className="text-primary text-2xl font-black">
                            ${price}
                        </span>
                    </div>

                    {rating && <RatingStars rating={rating} />}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
