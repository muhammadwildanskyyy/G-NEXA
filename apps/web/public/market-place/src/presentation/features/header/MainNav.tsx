"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";
import { Heart, ShoppingCart } from "lucide-react";
import { useUser } from "@/core/hooks/useAuth";
import { useEffect } from "react";
import ProfileIcon from "@/presentation/components/common/profile-icon";

const MainNav = () => {
    const user = useUser();

    useEffect(() => {
        console.log(user);
    }, [user]);
    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2 text-primary">
                    <span className="text-3xl font-black italic tracking-tight">
                        G-NEXA
                    </span>
                </div>

                <div className="flex-1 max-w-2xl hidden md:block">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-6 text-white">
                    <ProfileIcon />

                    <Link
                        href="/wishlist"
                        className="hover:text-primary transition-colors"
                    >
                        <Heart className="size-5" />
                    </Link>

                    <Link
                        href="/cart"
                        className="relative hover:text-primary transition-colors"
                    >
                        <ShoppingCart className="size-5" />
                        <span className="absolute -top-2 -right-2 bg-primary text-[10px] px-1 text-white">
                            3
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default MainNav;
