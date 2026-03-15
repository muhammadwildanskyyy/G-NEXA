"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/presentation/components/ui/card";
import { useRegister } from "@/core/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowRight,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
} from "lucide-react";

const registerSchema = z
    .object({
        full_name: z.string().min(2, "Full Name be at least 2 characters"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        phone_number: z
            .string()
            .min(10, "Phone number must be at least 10 characters"),
        confirm_password: z.string().min(6),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords don't match",
        path: ["confirm_password"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { mutate: registerUser, isPending } = useRegister();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFormValues) => {
        setError(null);
        // Exclude confirm_password from API payload
        const { confirm_password, ...registerData } = data;

        registerUser(registerData, {
            onSuccess: () => {
                router.push("/login?registered=true");
            },
            onError: (err: any) => {
                setError(err.message || "Registration failed");
            },
        });
    };

    const labelClassname = (ref: string) => {
        if (ref === "email") {
            console.log(watch("email"), watch("password"));
            return "";
        }
    };

    return (
        <main className="p-8 bg-background">
            {/* Header */}
            <header className="flex flex-col">
                <h1 className="text-white text-4xl font-bold">
                    ACCESS
                    <br />
                    <span className="text-secondary">YOUR SETUP</span>
                </h1>
                <p className="mt-2 text-[18px] text-foreground font-light">
                    Enter your credentials to access premium gear.
                </p>
            </header>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 flex flex-col gap-8"
            >
                {/* FULL NAME */}
                <div className="relative border-b">
                    <Input
                        id="full_name"
                        type="text"
                        autoComplete="name"
                        placeholder=" "
                        className="peer pr-10"
                        {...register("full_name")}
                    />
                    <Label
                        htmlFor="full_name"
                        className="absolute left-0 -top-3 text-sm text-muted-foreground
                                        transition-all
                                        peer-placeholder-shown:top-3
                                        peer-placeholder-shown:text-base
                                        peer-placeholder-shown:text-muted-foreground
                                        peer-focus:-top-3
                                        peer-focus:text-sm
                                        peer-focus:text-secondary"
                    >
                        Full Name
                    </Label>
                    <UserRound className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                    {errors.full_name && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.full_name.message}
                        </p>
                    )}
                </div>

                {/* EMAIL */}
                <div className="relative border-b">
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
                        className="absolute left-0 -top-3 text-sm text-muted-foreground
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

                {/* PHONE */}
                <div className="relative border-b">
                    <Input
                        id="phone_number"
                        type="tel"
                        autoComplete="tel"
                        placeholder=" "
                        className="peer pr-10"
                        {...register("phone_number")}
                    />
                    <Label
                        htmlFor="phone_number"
                        className="absolute left-0 -top-3 text-sm text-muted-foreground
                                    transition-all
                                    peer-placeholder-shown:top-3
                                    peer-placeholder-shown:text-base
                                    peer-placeholder-shown:text-muted-foreground
                                    peer-focus:-top-3
                                    peer-focus:text-sm
                                    peer-focus:text-secondary"
                    >
                        Phone Number
                    </Label>
                    <Phone className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                    {errors.phone_number && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.phone_number.message}
                        </p>
                    )}
                </div>

                {/* PASSWORD */}
                <div className="relative border-b">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder=" "
                        className="peer pr-10"
                        {...register("password")}
                    />
                    <Label
                        htmlFor="password"
                        className="absolute left-0 -top-3 text-sm text-muted-foreground
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

                {/* CONFIRM PASSWORD */}
                <div className="relative border-b">
                    <Input
                        id="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        placeholder=" "
                        className="peer pr-10"
                        {...register("confirm_password")}
                    />
                    <Label
                        htmlFor="confirm_password"
                        className="absolute left-0 -top-3 text-sm text-muted-foreground
                                    transition-all
                                    peer-placeholder-shown:top-3
                                    peer-placeholder-shown:text-base
                                    peer-placeholder-shown:text-muted-foreground
                                    peer-focus:-top-3
                                    peer-focus:text-sm
                                    peer-focus:text-secondary"
                    >
                        Confirm Password
                    </Label>
                    <ShieldCheck className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                    {errors.confirm_password && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.confirm_password.message}
                        </p>
                    )}
                </div>
                <Link href={"/forget-password"} className="text-right text-sm ">
                    FORGOT PASSWORD?
                </Link>
                <Button
                    size={"lg"}
                    className="text-white bg-secondary h-12 cursor-pointer"
                >
                    Register Now <ArrowRight />
                </Button>
            </form>
            <div className="relative w-full border-b mt-16 opacity-50">
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
                Already have account?{" "}
                <Link href="/login" className="font-semibold text-white">
                    SIGN IN
                </Link>
            </p>
        </main>
    );
}
