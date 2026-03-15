const SearchBar = () => {
    return (
        <div className="relative w-full">
            <input
                type="text"
                placeholder="Cari produk, tren, dan merek."
                className="w-full bg-transparent border border-slate-700 text-white px-6 py-3 text-sm uppercase tracking-wider focus:border-primary focus:outline-none"
            />
            <button className="absolute right-1 top-1 bottom-1 px-4 bg-black border border-slate-700 hover:text-primary transition-colors">
                🔍
            </button>
        </div>
    );
};
export default SearchBar;
