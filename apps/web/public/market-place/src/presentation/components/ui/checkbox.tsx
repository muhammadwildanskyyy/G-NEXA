"use client";

import { cn } from "@/lib/utils";

interface CheckboxProps {
    label: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    className?: string;
}

export default function Checkbox({
    label,
    checked = false,
    onChange,
    className,
}: CheckboxProps) {
    return (
        <label
            className={cn(
                "flex items-center gap-2 cursor-pointer group select-none",
                className,
            )}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange?.(e.target.checked)}
                className="
          w-4 h-4
          bg-transparent
          border border-border-dark
          text-primary
          focus:ring-0
          checked:bg-primary
          checked:border-primary
        "
            />

            <span className="text-slate-400 text-[10px] font-bold uppercase group-hover:text-white transition-colors">
                {label}
            </span>
        </label>
    );
}
