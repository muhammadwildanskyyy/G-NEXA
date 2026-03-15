import CountdownTimer from "./CountdownTimer";

const RamadanBanner = () => {
    return (
        <section className="relative bg-primary overflow-hidden py-16 my-24">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,#fff_0,#fff_1px,transparent_0,transparent_10px)]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    {/* Text */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter">
                            BIG RAMADAN SALE
                        </h2>

                        <p className="text-white/80 text-lg font-light tracking-wide uppercase mt-2">
                            UP TO{" "}
                            <span className="font-black underline">
                                60% OFF
                            </span>{" "}
                            PREMIUM GEAR
                        </p>
                    </div>

                    {/* Countdown */}
                    <CountdownTimer targetDate="2026-03-25T00:00:00" />

                    {/* Button */}
                    <button className="bg-white text-primary hover:bg-black hover:text-white px-8 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
                        VIEW DEALS
                    </button>
                </div>
            </div>
        </section>
    );
};
export default RamadanBanner;
