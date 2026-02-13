'use client';

import { useUser, useLogout } from '@/application/hooks/useAuth';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, User as UserIcon, Package, Settings, CreditCard } from 'lucide-react';

export default function DashboardPage() {
    const { data: user, isLoading, isAuthenticated } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const logout = useLogout();

    const handleLogout = () => {
        logout();
    };

    if (isLoading) {
        return <div className="container py-20 text-center animate-pulse">Loading dashboard...</div>;
    }

    if (!user) {
        return null; // Redirecting
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-4">
                    <Card>
                        <CardContent className="p-4 pt-4">
                            <div className="flex flex-col items-center space-y-3 mb-6">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <UserIcon className="h-10 w-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold">{user.fullName}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <nav className="space-y-2">
                                <Button variant="secondary" className="w-full justify-start gap-2">
                                    <UserIcon className="h-4 w-4" /> Profile
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <Package className="h-4 w-4" /> Orders
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <CreditCard className="h-4 w-4" /> Billing
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <Settings className="h-4 w-4" /> Settings
                                </Button>
                                <hr className="my-2" />
                                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4" /> Logout
                                </Button>
                            </nav>
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className="flex-1 space-y-6">
                    <h1 className="text-3xl font-bold">Dashboard</h1>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">
                                    +2 from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1</div>
                                <p className="text-xs text-muted-foreground">
                                    Pro Plan
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>You have no recent activity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg">
                                No activity to show
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
