interface CategoryCardProps {
    title: string;
    image: string;
    index: number;
}

const CategoryCard = ({ title, image, index }: CategoryCardProps) => {
    return (
        <div className="group relative aspect-square overflow-hidden bg-surface-dark border border-border-dark cursor-pointer">
            {/* Image */}
            <img
                src={image}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradient Overlay */}
            <div
                className="
        absolute inset-0
        bg-linear-to-t from-black via-black/40 to-transparent
        transform opacity-100
        group-hover:translate-y-full group-hover:opacity-50
        transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
    "
            />

            {/* Content */}
            <div className="absolute bottom-6 left-6 z-10">
                <p className="text-primary font-black text-xs uppercase tracking-widest mb-1">
                    {String(index).padStart(2, "0")}
                </p>

                <h4 className="text-white text-2xl font-black italic tracking-tighter uppercase">
                    {title}
                </h4>
            </div>

            {/* Hover Border Effect */}
            <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};
export default CategoryCard;
