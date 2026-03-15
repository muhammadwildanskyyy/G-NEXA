"use client";

import { useUser, useUpdateProfile } from "@/core/hooks/useAuth";
import { useUploadMedia } from "@/core/hooks/useMedia";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/presentation/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera } from "lucide-react";

const profileSchema = z.object({
    full_name: z.string().min(2, "Full Name must be at least 2 characters"),
    phone_number: z
        .string()
        .min(10, "Phone number must be at least 10 characters"),
    bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function UserProfilePage() {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useUser();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
    const { mutate: uploadMedia, isPending: isUploading } = useUploadMedia();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push("/login");
        }
        if (user) {
            setValue("full_name", user.full_name);
            setValue("phone_number", user.phone_number);
            setValue("bio", user.bio || "");
        }
    }, [user, isUserLoading, router, setValue]);

    const onSubmit = (data: ProfileFormValues) => {
        setSuccessMessage(null);
        updateProfile(data, {
            onSuccess: () => {
                setSuccessMessage("Profile updated successfully!");
                setTimeout(() => setSuccessMessage(null), 3000);
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMedia(file, {
                onSuccess: (response: any) => {
                    // Update profile with new image URL
                    updateProfile(
                        { profilePicture: response.data.FileURL },
                        {
                            onSuccess: () => {
                                setSuccessMessage("Profile picture updated!");
                                setTimeout(() => setSuccessMessage(null), 3000);
                            },
                        },
                    );
                },
                onError: (error) => {
                    console.error("Upload failed", error);
                },
            });
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>
                        Manage your profile information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative h-32 w-32 rounded-full overflow-hidden bg-muted border-2 border-primary/20 group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {user.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.full_name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-muted-foreground uppercase">
                                    {user.full_name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {isUploading && (
                            <p className="text-sm text-muted-foreground animate-pulse">
                                Uploading...
                            </p>
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {successMessage && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                                {successMessage}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    {...register("full_name")}
                                />
                                {errors.full_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.full_name.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <Input
                                id="phone_number"
                                {...register("phone_number")}
                            />
                            {errors.phone_number && (
                                <p className="text-sm text-destructive">
                                    {errors.phone_number.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input
                                id="bio"
                                placeholder="Tell us about yourself"
                                {...register("bio")}
                            />
                            {errors.bio && (
                                <p className="text-sm text-destructive">
                                    {errors.bio.message}
                                </p>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isUpdating || isUploading}
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
