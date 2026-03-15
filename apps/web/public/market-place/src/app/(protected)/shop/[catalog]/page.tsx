import SectionHeader from "@/presentation/components/ui/section-header";
import FilterSidebar from "@/presentation/features/catalog/filters/FilterSidebar";
import Pagination from "@/presentation/features/catalog/product/Pagination";
import ProductGrid from "@/presentation/features/catalog/product/ProductGrid";
// import { useEffect } from "react";

const CatalogPage = async ({
    params,
}: {
    params: Promise<{ catalog: string }>;
}) => {
    const { catalog } = await params;

    // useEffect(() => {

    // }, [catalog])

    return (
        <section className="max-w-7xl mx-auto px-4 py-8 mb-12">
            <div className="flex flex-col lg:flex-row gap-8">
                <FilterSidebar />

                <div className="flex-1">
                    <SectionHeader title={catalog} count={1455} />

                    <ProductGrid />

                    <Pagination />
                </div>
            </div>
        </section>
    );
};

export default CatalogPage;
