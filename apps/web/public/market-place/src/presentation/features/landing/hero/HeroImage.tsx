const HeroImage = () => {
    return (
        <div className="relative lg:w-1/2 min-h-[400px]">
            {/* Overlay glow */}
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10" />

            {/* Image */}
            <img
                src="/images/hero-landing-page.png"
                alt="Mechanical Keyboard"
                className="absolute inset-0 w-full h-full object-cover hover:grayscale-0 transition-all duration-700"
            />

            {/* Bottom Tag */}
            <div className="absolute bottom-0 left-0 p-8 z-20">
                <span className="bg-primary text-white text-[10px] font-black px-3 py-1 uppercase tracking-[0.3em]">
                    G-NEXA
                </span>
            </div>
        </div>
    );
};
export default HeroImage;
