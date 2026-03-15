import { Globe, Instagram, Phone } from "lucide-react";
import FooterColumn from "../landing/footer/FooterColumn";
import Newsletter from "../landing/footer/Newsletter";

const Footer = () => {
    return (
        <footer className="bg-background-dark border-t border-border-dark pt-24 pb-10">
            <div className="max-w-7xl mx-auto px-4">
                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-8">
                            <span className="text-3xl font-black italic">
                                G-NEXA
                            </span>
                        </div>

                        <p className="text-slate-400 leading-relaxed mb-8">
                            The ultimate destination for next-gen digital
                            accessories. Precision engineered, performance
                            driven.
                        </p>

                        {/* Social */}
                        <div className="flex gap-4">
                            <button className="w-10 h-10 flex items-center justify-center bg-surface-dark border border-border-dark text-primary hover:bg-primary hover:text-white transition-all">
                                <Globe className="size-5" />
                            </button>

                            <button className="w-10 h-10 flex items-center justify-center bg-surface-dark border border-border-dark text-primary hover:bg-primary hover:text-white transition-all">
                                <Instagram className="size-5" />
                            </button>

                            <button className="w-10 h-10 flex items-center justify-center bg-surface-dark border border-border-dark text-primary hover:bg-primary hover:text-white transition-all">
                                <Phone className="size-5" />
                            </button>
                        </div>
                    </div>

                    <FooterColumn
                        title="Company"
                        links={[
                            "About Us",
                            "Tech Careers",
                            "Sustainability",
                            "Newsroom",
                        ]}
                    />

                    <FooterColumn
                        title="Support"
                        links={[
                            "Order Status",
                            "Returns & Exchanges",
                            "Technical Support",
                            "Warranty Info",
                        ]}
                    />

                    <Newsletter />
                </div>

                {/* Bottom */}
                <div className="pt-10 border-t border-border-dark mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        © 2026 G-NEXA DIGITAL. ALL SYSTEMS OPERATIONAL.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
