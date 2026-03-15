const ItemNav = () => {
    const categories = ["Audio", "Keyboards", "Wearable", "Control"];
    return (
        <div className="border-t border-border-dark">
            <div className="max-w-7xl mx-auto px-4">
                <nav className="flex items-center gap-12 py-4 overflow-x-auto">
                    {categories.map((cat) => (
                        <a
                            key={cat}
                            href="#"
                            className="text-white hover:text-primary text-sm font-black uppercase tracking-[0.2em] transition-colors whitespace-nowrap"
                        >
                            {cat}
                        </a>
                    ))}

                    <div className="flex-1" />
                </nav>
            </div>
        </div>
    );
};
export default ItemNav;
