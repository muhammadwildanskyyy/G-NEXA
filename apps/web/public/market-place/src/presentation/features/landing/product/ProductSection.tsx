import ProductCard from "./ProductCard";

export const products = [
    {
        id: 1,
        name: "X-Pro Stealth 500",
        category: "Audio",
        price: 249.99,
        image: "/images/category-audio.webp",
        rating: 5,
        badge: "new",
    },
    {
        id: 2,
        name: "Swift-Core RGB",
        category: "Control",
        price: 89.99,
        image: "/images/category-control.webp",
        rating: 4,
        badge: "sale",
    },
    {
        id: 3,
        name: "Astra Chrono VII",
        category: "Wearable",
        price: 299.99,
        oldPrice: 399,
        image: "/images/category-wearable.webp",
        badge: "sale",
    },
    {
        id: 4,
        name: "Ghost 60% Linear",
        category: "Keyboards",
        price: 159,
        image: "/images/category-keyboard.webp",
        badge: "sale",
    },
];

const ProductSection = () => {
    return (
        <section className="max-w-7xl w-full mx-auto px-4 pb-24">
            {/* Section Title */}
            <div className="text-center mb-16">
                <p className="text-primary font-black uppercase tracking-[0.5em] text-xs mb-4">
                    Featured
                </p>

                <h2 className="text-5xl font-black text-white italic tracking-tighter">
                    PREMIUM HARDWARE
                </h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12">
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>

            {/* Load More */}
            <div className="mt-20 flex justify-center">
                <button className="border border-primary text-primary hover:bg-primary hover:text-white px-16 py-5 text-sm font-black uppercase tracking-[0.3em] transition-all">
                    Load More Gear
                </button>
            </div>
        </section>
    );
};

export default ProductSection;
