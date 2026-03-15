import { ChevronDown, Expand } from "lucide-react";

const SectionHeader = ({ title, count }: { title: string; count: number }) => {
    return (
        <div className="flex items-center justify-between mb-8 border-b border-border-dark pb-4">
            <div className="flex items-center gap-4">
                <h1 className="text-white text-2xl font-black italic tracking-tighter">
                    {title}
                </h1>

                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {count} ITEMS FOUND
                </span>
            </div>

            <button className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary">
                Sort By: Popularity
                <ChevronDown className="size-4" />
            </button>
        </div>
    );
};
export default SectionHeader;
