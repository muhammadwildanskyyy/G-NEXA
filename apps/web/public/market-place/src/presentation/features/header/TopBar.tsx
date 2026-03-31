const TopBar = () => {
    return (
        <div className="bg-zinc-900 border-b border-border-dark py-2">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <a href="#" className="hover:text-primary transition-colors">
                    Gratis Pengembalian | S&K Berlaku
                </a>

                <a href="#" className="hover:text-primary transition-colors">
                    <span className="bg-primary text-white px-1 mr-2">VIP</span>
                    G-NEXA VIP: Unlimited Free & Faster Delivery
                </a>

                <a href="#" className="hover:text-primary transition-colors">
                    Download App & Dapatkan Diskon 25%
                </a>
            </div>
        </div>
    );
};
export default TopBar;
