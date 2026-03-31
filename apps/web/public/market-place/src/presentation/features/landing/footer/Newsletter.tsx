const Newsletter = () => {
    return (
        <div>
            <h4 className="text-white text-sm font-black uppercase tracking-[0.3em] mb-8 border-l-4 border-primary pl-4">
                Join the Nexa
            </h4>

            <p className="text-slate-400 text-sm mb-6 uppercase tracking-wider">
                Subscribe for early drops and exclusive intel.
            </p>

            <div className="flex">
                <input
                    type="email"
                    placeholder="YOUR EMAIL"
                    className="bg-surface-dark border border-border-dark text-white text-xs p-4 w-full focus:outline-none focus:border-primary"
                />

                <button className="bg-primary text-white px-6 hover:bg-white hover:text-primary transition-all">
                    ➤
                </button>
            </div>
        </div>
    );
};

export default Newsletter;
