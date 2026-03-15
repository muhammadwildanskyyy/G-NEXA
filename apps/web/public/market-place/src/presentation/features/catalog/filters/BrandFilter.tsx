import { ChevronDown } from "lucide-react";

const BrandFilter = () => {
    return (
        <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest border-b border-border-dark pb-3 mb-4 flex justify-between items-center">
                Brand
                <ChevronDown className="size-4"/>
            </h3>

            <div className="space-y-2">
                <FilterItem label="G-Nexa Pro" />
                <FilterItem label="Astra Tech" />
                <FilterItem label="Vortex Labs" />
                <FilterItem label="M-Logic" />
            </div>
        </div>
    );
};

const FilterItem = ({ label }: { label: string }) => {
    return (
        <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-4 h-4 border border-border-dark group-hover:border-primary" />

            <span className="text-slate-400 text-xs uppercase font-bold group-hover:text-white">
                {label}
            </span>
        </div>
    );
};
export default BrandFilter;
