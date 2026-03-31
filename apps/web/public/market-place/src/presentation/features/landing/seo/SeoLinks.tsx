const SeoLinks = () => {
    const brands = [
        "Guess",
        "Birkenstock",
        "Melissa",
        "Havaianas",
        "Nike",
        "Vans",
        "Dr Martens",
        "Lacoste",
        "Skechers",
        "Adidas",
        "Crocs",
        "Mango",
        "Rip Curl",
    ];

    const searches = [
        "Tas",
        "Fashion Anak",
        "Jam Tangan Pria",
        "Baju Wanita",
        "Sepatu Sneakers Wanita",
        "Batik",
        "Baju Koko",
        "Jilbab",
        "Skincare",
        "Promo 11.11",
        "Sepatu Sneakers Pria",
    ];

    return (
        <div className="grid md:grid-cols-2 gap-12">
            {/* Brand */}
            <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6">
                    Brand Paling Top
                </h3>

                <div className="grid grid-cols-2 gap-3 text-slate-400 text-sm">
                    {brands.map((brand) => (
                        <a
                            key={brand}
                            href="#"
                            className="hover:text-primary transition-colors"
                        >
                            {brand}
                        </a>
                    ))}
                </div>
            </div>

            {/* Searches */}
            <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6">
                    Pencarian Populer
                </h3>

                <div className="grid grid-cols-2 gap-3 text-slate-400 text-sm">
                    {searches.map((item) => (
                        <a
                            key={item}
                            href="#"
                            className="hover:text-primary transition-colors"
                        >
                            {item}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeoLinks;
