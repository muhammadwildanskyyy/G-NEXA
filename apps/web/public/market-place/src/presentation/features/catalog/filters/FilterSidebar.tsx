import BrandFilter from "./BrandFilter";
import CategoryFilter from "./CategoryFilter";
import ColorFilter from "./ColorFilter";
import PriceFilter from "./PriceFilter";

const FilterSidebar = () => {
    return (
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
            <BrandFilter />

            <CategoryFilter />

            <PriceFilter />

            <ColorFilter />
        </aside>
    );
};
export default FilterSidebar;
