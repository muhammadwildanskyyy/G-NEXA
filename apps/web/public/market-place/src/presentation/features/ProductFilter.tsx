import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/presentation/components/ui/accordion";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select";
import { Separator } from "@/presentation/components/ui/separator";
import { ProductFilter as FilterModel } from "@/domain/models/Product";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ProductFilterProps {
    filters: FilterModel;
    onFilterChange: (newFilters: FilterModel) => void;
    onClearFilters: () => void;
    className?: string;
}

import { useCategories } from "@/application/hooks/useCategories";
import { Category } from "@/domain/models/Product";
import { ChevronRight } from "lucide-react";

const CONDITIONS = ["new", "used"];

export function ProductFilter({
    filters,
    onFilterChange,
    onClearFilters,
    className,
}: ProductFilterProps) {
    const { data: categories = [] } = useCategories();

    // Organize categories into hierarchy
    const parentCategories = categories.filter(c => !c.parent_id);
    const getChildCategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    // Local state for price range to avoid excessive API calls on slider drag
    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.min_price || 0,
        filters.max_price || 0,
    ]);

    // Update local state when props change
    useEffect(() => {
        setPriceRange([filters.min_price || 0, filters.max_price || 0]);
    }, [filters.min_price, filters.max_price]);

    const handlePriceChange = (value: number[]) => {
        setPriceRange([value[0], value[1]]);
    };

    const handlePriceCommit = (value: number[]) => {
        onFilterChange({
            ...filters,
            min_price: value[0],
            max_price: value[1],
            page: 1, // Reset page on filter change
        });
    };

    const handleCategoryChange = (categoryId: string) => {
        onFilterChange({
            ...filters,
            category_id: categoryId,
            page: 1,
        });
    };

    const handleConditionChange = (condition: string) => {
        onFilterChange({
            ...filters,
            condition: condition === "all" ? undefined : (condition as "new" | "used"),
            page: 1,
        });
    }

    const handleSortChange = (sort: string) => {
        onFilterChange({
            ...filters,
            sort_by: sort as "latest" | "oldest" | "price_asc" | "price_desc" | "views",
            page: 1,
        });
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="h-auto px-2 text-muted-foreground hover:text-foreground"
                >
                    Clear All
                </Button>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select
                        value={filters.sort_by || "latest"}
                        onValueChange={handleSortChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">Newest Arrivals</SelectItem>
                            <SelectItem value="views">Popular (Views)</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <Accordion type="multiple" defaultValue={["category", "price", "condition"]} className="w-full">
                <AccordionItem value="category">
                    <AccordionTrigger>Category</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-1 pt-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <Button
                                    variant={!filters.category_id ? "secondary" : "ghost"}
                                    size="sm"
                                    className="justify-start w-full font-normal"
                                    onClick={() => onFilterChange({ ...filters, category_id: undefined, page: 1 })}
                                >
                                    All Categories
                                </Button>
                            </div>

                            {parentCategories.map((parent) => (
                                <div key={parent.id} className="space-y-1">
                                    <div className="px-2 py-1.5 text-sm font-semibold text-foreground/80 flex items-center">
                                        {parent.name}
                                    </div>
                                    <div className="pl-2 border-l ml-2 space-y-1">
                                        {getChildCategories(parent.id).map((child) => (
                                            <Button
                                                key={child.id}
                                                variant={filters.category_id === child.id ? "secondary" : "ghost"}
                                                size="sm"
                                                className="justify-start w-full font-normal h-8 text-xs"
                                                onClick={() => handleCategoryChange(child.id)}
                                            >
                                                {child.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price">
                    <AccordionTrigger>Price Range</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-4 px-1">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Min</Label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">Rp</span>
                                        <Input
                                            type="number"
                                            value={priceRange[0]}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setPriceRange([val, priceRange[1]]);
                                            }}
                                            onBlur={() => handlePriceCommit(priceRange)}
                                            className="h-8 pl-8 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Max</Label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">Rp</span>
                                        <Input
                                            type="number"
                                            value={priceRange[1]}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setPriceRange([priceRange[0], val]);
                                            }}
                                            onBlur={() => handlePriceCommit(priceRange)}
                                            className="h-8 pl-8 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="condition">
                    <AccordionTrigger>Condition</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant={!filters.condition ? "secondary" : "ghost"}
                                    size="sm"
                                    className="justify-start w-full font-normal"
                                    onClick={() => handleConditionChange("all")}
                                >
                                    Any Condition
                                </Button>
                            </div>
                            {CONDITIONS.map((cond) => (
                                <div key={cond} className="flex items-center space-x-2">
                                    <Button
                                        variant={filters.condition === cond ? "secondary" : "ghost"}
                                        size="sm"
                                        className="justify-start w-full font-normal capitalize"
                                        onClick={() => handleConditionChange(cond)}
                                    >
                                        {cond}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
