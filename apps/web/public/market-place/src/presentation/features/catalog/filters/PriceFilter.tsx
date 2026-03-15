import Checkbox from "@/presentation/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

const PriceFilter = () => {
    return (
        <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest border-b border-border-dark pb-3 mb-4 flex justify-between items-center">
                Harga
                <ChevronDown className="size-4" />
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <input
                    placeholder="Min"
                    className="bg-surface-dark border-border-dark text-xs text-white p-2 w-full"
                />

                <input
                    placeholder="Max"
                    className="bg-surface-dark border-border-dark text-xs text-white p-2 w-full"
                />
            </div>

            <div className="space-y-2">
                <Checkbox label="$0 - $100" />
                <Checkbox label="$100 - $250" />
                <Checkbox label="$250+" />
            </div>
        </div>
    );
};
export default PriceFilter;
