import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

const HeroSection = () => {
    return (
        <section className="relative flex flex-col lg:flex-row border-b border-border-dark min-h-[700px] overflow-hidden">
            <HeroImage />
            <HeroContent />
        </section>
    );
};
export default HeroSection;
