import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = () => {
    return (
        <div className="mt-16 flex items-center justify-center gap-2">
            <button className="w-10 h-10 border border-border-dark flex items-center justify-center text-slate-400">
                <ChevronLeft className="size-4" />
            </button>

            <button className="w-10 h-10 bg-primary text-white flex items-center justify-center font-black">
                1
            </button>

            <button className="w-10 h-10 border border-border-dark flex items-center justify-center text-slate-400 font-black">
                2
            </button>

            <button className="w-10 h-10 border border-border-dark flex items-center justify-center text-slate-400 font-black">
                3
            </button>

            <span className="text-slate-600 px-2">...</span>

            <button className="w-10 h-10 border border-border-dark flex items-center justify-center text-slate-400 font-black">
                48
            </button>

            <button className="w-10 h-10 border border-border-dark flex items-center justify-center text-slate-400">
                <ChevronRight className="size-4" />
            </button>
        </div>
    );
};
export default Pagination;
