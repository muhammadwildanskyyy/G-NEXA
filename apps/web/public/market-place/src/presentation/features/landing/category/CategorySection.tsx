import CategoryCard from "./CategoryCard";

const categories = [
    {
        id: 1,
        title: "Audio",
        image: "/images/category-audio.webp",
    },
    {
        id: 2,
        title: "Controls",
        image: "/images/category-control.webp",
    },
    {
        id: 3,
        title: "Wearables",
        image: "/images/category-wearable.webp",
    },
    {
        id: 4,
        title: "Keyboards",
        image: "/images/category-keyboard.webp",
    },
];

const CategorySection = () => {
    return (
        <section className="max-w-7xl w-full mx-auto px-4 py-24">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
                <div>
                    <p className="text-primary font-black uppercase tracking-widest text-sm mb-2">
                        Categories
                    </p>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">
                        ELITE GEAR SELECTION
                    </h2>
                </div>

                <div className="hidden md:block h-px flex-1 bg-border-dark mx-8 mb-4" />

                <a
                    href="#"
                    className="text-slate-400 hover:text-primary font-black text-xs uppercase tracking-[0.2em] mb-4"
                >
                    View All
                </a>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((category, index) => (
                    <CategoryCard
                        key={category.id}
                        index={index + 1}
                        {...category}
                    />
                ))}
            </div>
        </section>
    );
};
export default CategorySection;
