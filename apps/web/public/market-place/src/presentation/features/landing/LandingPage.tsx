import Footer from "../layout/Footer";
import Header from "../layout/Header";
import RamadanBanner from "./banner/RamadanBanner";
import CategorySection from "./category/CategorySection";
import HeroSection from "./hero/HeroSection";
import ProductSection from "./product/ProductSection";
import SeoSection from "./seo/SeoSection";

const LandingPage = () => {
    return (
        <>
            <Header />
            <HeroSection />
            <CategorySection />
            <RamadanBanner />
            <ProductSection />
            <SeoSection />
            <Footer />
        </>
    );
};
export default LandingPage;
