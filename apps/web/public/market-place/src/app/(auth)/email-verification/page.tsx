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

export default function EmailVerificationPage() {
    return (
        <main className="p-8 bg-background min-h-screen flex flex-col justify-center items-center">
            <div className="max-w-md w-full">
                {/* HEADER */}
                <section>
                    <h1 className="text-white text-4xl font-bold leading-tight">
                        VERIFY <br />
                        <span className="text-secondary">YOUR EMAIL</span>
                    </h1>

                    <p className="mt-3 text-sm text-foreground font-light">
                        We’ve sent a verification link to your email address.
                        Click the link in that email to activate your account.
                    </p>
                </section>

                {/* ACTIONS */}
                <div className="mt-6 flex flex-col gap-3">
                    <Link
                        href="/login"
                        className="w-full flex justify-center items-center gap-2 text-center py-3 rounded-lg border text-white font-semibold hover:bg-secondary hover:border-black hover:text-black transition"
                    >
                        Back to Login{" "}
                        <span>
                            <ArrowRight className="size-4" />
                        </span>
                    </Link>

                    <button className="text-sm text-foreground/70 hover:text-white transition cursor-pointer">
                        Resend verification email
                    </button>
                </div>
            </div>
        </main>
    );
}
