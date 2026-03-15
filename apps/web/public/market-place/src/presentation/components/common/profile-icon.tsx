import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { LayoutDashboard, LogOut, Settings, UserIcon } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { useLogout, useUser } from "@/core/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const ProfileIcon = () => {
    const { data: user, isAuthenticated } = useUser();

    const logout = useLogout();
    const handleLogout = () => {
        logout();
    };

    if (isAuthenticated) {
        return (
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="
                                relative flex items-center justify-center
                                h-8 w-8 rounded-full
                                border border-white/10
                                bg-white/5
                                transition-all duration-200
                                hover:bg-white/10 hover:border-white/20
                                focus:outline-none focus:ring-2 focus:ring-primary/40
                            "
                        >
                            <Avatar className="h-7 w-7 flex justify-center items-center">
                                <AvatarImage
                                    src={user.profilePicture || ""}
                                    alt={user.full_name || "User"}
                                />
                                <AvatarFallback>
                                    {getInitials(user.full_name || "User")}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-56"
                        align="end"
                        forceMount
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user.full_name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href="/user-profile"
                                className="cursor-pointer"
                            >
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    } else {
        return (
            <p className="cursor-pointer">
                <Link
                    href="/login"
                    className="text-sm font-black uppercase tracking-widest hover:text-primary transition-colors"
                >
                    Masuk
                </Link>
                {" / "}
                <Link
                    href="/register"
                    className="text-sm font-black uppercase tracking-widest hover:text-primary transition-colors"
                >
                    Daftar
                </Link>
            </p>
        );
    }
};
export default ProfileIcon;
