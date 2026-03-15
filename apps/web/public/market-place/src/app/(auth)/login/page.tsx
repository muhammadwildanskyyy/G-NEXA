"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { useLogin } from "@/core/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Minimum 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { mutate: login, isPending } = useLogin();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormValues) => {
        setError(null);
        login(data, {
            onSuccess: () => router.push("/"),
            onError: (err: any) =>
                setError(err?.message || "Invalid email or password"),
        });
    };

    return (
        <main className="p-8 bg-background min-h-screen flex flex-col justify-center">
            {/* HEADER */}
            <header>
                <h1 className="text-white text-4xl font-bold leading-tight">
                    ACCESS <br />
                    <span className="text-secondary">YOUR SETUP</span>
                </h1>
                <p className="mt-2 text-lg text-foreground font-light">
                    Enter your credentials to access premium gear.
                </p>
            </header>

            {/* FORM */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 flex flex-col gap-6"
            >
                {/* EMAIL */}
                <div className="relative border-b cursor">
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder=" "
                        className="peer pr-10"
                        {...register("email")}
                    />
                    <Label
                        htmlFor="email"
                        className="absolute cursor-pointer left-0 -top-3 text-sm text-muted-foreground
      transition-all
      peer-placeholder-shown:top-3
      peer-placeholder-shown:text-base
      peer-placeholder-shown:text-muted-foreground
      peer-focus:-top-3
      peer-focus:text-sm
      peer-focus:text-secondary"
                    >
                        Email Address
                    </Label>
                    <Mail className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                    {errors.email && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* PASSWORD */}
                <div className="relative border-b">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="password"
                        placeholder=" "
                        className="peer pr-10"
                        {...register("password")}
                    />
                    <Label
                        htmlFor="password"
                        className="absolute cursor-pointer left-0 -top-3 text-sm text-muted-foreground
      transition-all
      peer-placeholder-shown:top-3
      peer-placeholder-shown:text-base
      peer-placeholder-shown:text-muted-foreground
      peer-focus:-top-3
      peer-focus:text-sm
      peer-focus:text-secondary"
                    >
                        Password
                    </Label>
                    <LockKeyhole className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                    {errors.password && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {error && (
                    <p className="text-sm text-destructive text-center">
                        {error}
                    </p>
                )}

                <Link href="/forget-password" className="text-right text-sm">
                    FORGOT PASSWORD?
                </Link>

                <Button
                    size="lg"
                    type="submit"
                    disabled={isPending}
                    className="text-white bg-secondary h-12 cursor-pointer"
                >
                    {isPending ? "Loading..." : "LOGIN TO ACCOUNT"}
                    <ArrowRight />
                </Button>
            </form>

            {/* Divider */}
            <div className="relative w-full border-b mt-12 opacity-50">
                <p className="absolute -top-2 left-1/2 -translate-x-1/2 bg-background px-4 text-sm">
                    OR CONNECT WITH
                </p>
            </div>

            <div className="mt-8 flex gap-4">
                <Button
                    variant="outline"
                    className="w-full hover:bg-gray-300 hover:text-black cursor-pointer"
                >
                    <img src="/icons/google.svg" alt="" className="size-5" />
                    Google
                </Button>
                <Button
                    variant="outline"
                    className="w-full hover:bg-gray-300 hover:text-black cursor-pointer"
                >
                    <img
                        src="/icons/apple.svg"
                        alt=""
                        className="size-5 fill-red-500"
                    />
                    Apple
                </Button>
            </div>

            <p className="mt-8 text-center">
                Don't have account?{" "}
                <Link href="/register" className="font-semibold text-white">
                    SIGN UP
                </Link>
            </p>
        </main>
    );
}
