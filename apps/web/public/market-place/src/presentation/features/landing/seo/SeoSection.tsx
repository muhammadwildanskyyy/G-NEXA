import { cn } from "@/lib/utils";
import PartnerLogos from "./PartnersLogo";
import SeoLinks from "./SeoLinks";

const SeoSection = () => {
    return (
        <section className="bg-background-dark border-t border-border-dark py-24">
            <div className="max-w-7xl mx-auto px-4 space-y-16">
                {/* SEO Text */}
                <div className="space-y-6 w-full text-justify">
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide ">
                        Belanja Online Fashion Wanita Terbaru
                    </h2>

                    <p className="text-slate-400 leading-relaxed">
                        Sebagai platform marketplace terdepan, Gnexa Indonesia
                        hadir untuk memenuhi berbagai kebutuhan gaya hidup dan
                        aktivitas Anda dalam satu tempat. Kami berkomitmen untuk
                        menghadirkan pengalaman berbelanja online yang
                        komprehensif, aman, dan tanpa hambatan. Mulai dari
                        perangkat elektronik, perlengkapan rumah tangga, produk
                        kecantikan dan kesehatan, hingga kebutuhan harian, Gnexa
                        membawa kurasi produk dari brand lokal dan internasional
                        terbaik. Kami memastikan Anda selalu memiliki akses ke
                        produk berkualitas yang mendukung produktivitas dan gaya
                        hidup Anda, kapanpun dan di manapun.
                    </p>

                    <p className="text-slate-400 leading-relaxed">
                        Meski menghadirkan kategori yang luas, kami tetap
                        menaruh perhatian besar pada dunia mode sebagai bagian
                        penting dari ekspresi diri. Gnexa Indonesia tetap
                        menjadi destinasi utama untuk tren fashion terkini.
                        Khusus bagi para wanita, Anda dapat menemukan koleksi
                        pakaian yang sempurna untuk segala acara. Kami juga
                        menyediakan pilihan busana muslim yang lengkap dan
                        modern, seperti kaftan, gamis, tunik muslim, dress
                        muslim, hingga berbagai jenis hijab eksklusif dari karya
                        desainer serta brand lokal terbaik tanah air.
                    </p>

                    <p className="text-slate-400 leading-relaxed">
                        Lebih dari sekadar tempat berbelanja, ekosistem
                        marketplace Gnexa dirancang untuk mempermudah hidup
                        Anda. Temukan gadget terbaru, perlengkapan hobi, hingga
                        kebutuhan otomotif dengan penawaran yang kompetitif. Di
                        Gnexa, setiap pencarian Anda akan berujung pada pilihan
                        produk yang tepat.
                    </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="text-white font-bold">Kategori:</span>

                    {[
                        "Luxury",
                        "Zalora",
                        "Pakaian",
                        "Sepatu",
                        "Tas",
                        "Jam & Aksesoris",
                        "Baju Muslim",
                        "Sports",
                        "Batik",
                        "Beauty",
                    ].map((item, index) => (
                        <a
                            key={item}
                            href="#"
                            className={cn(
                                { "border-r": !(index > 8) },
                                "hover:text-primary transition-colors block pr-4",
                            )}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* Link grids */}
                <SeoLinks />

                {/* Partner logos */}
                <PartnerLogos />
            </div>
        </section>
    );
};

export default SeoSection;
