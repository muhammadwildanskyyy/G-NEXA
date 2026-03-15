import ProductCard from "./ProductCard";

const ProductGrid = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard />
            <ProductCard />
            <ProductCard />

            <ProductCard />
            <ProductCard />
            <ProductCard />
        </div>
    );
};
export default ProductGrid;
