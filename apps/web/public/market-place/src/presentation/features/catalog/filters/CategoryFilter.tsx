import { ChevronDown } from "lucide-react";

const CategoryFilter = () => {
    return (
        <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest border-b border-border-dark pb-3 mb-4 flex justify-between items-center">
                Kategori
                <ChevronDown className="size-4" />
            </h3>

            <div className="space-y-3">
                <a className="block text-primary text-xs font-bold uppercase">
                    All Hardware
                </a>

                <a className="block text-slate-400 text-xs font-bold uppercase hover:text-white">
                    Mechanical Keyboards
                </a>

                <a className="block text-slate-400 text-xs font-bold uppercase hover:text-white">
                    Optical Mice
                </a>

                <a className="block text-slate-400 text-xs font-bold uppercase hover:text-white">
                    Pro Audio
                </a>

                <a className="block text-slate-400 text-xs font-bold uppercase hover:text-white">
                    Wearables
                </a>
            </div>
        </div>
    );
};
export default CategoryFilter;
