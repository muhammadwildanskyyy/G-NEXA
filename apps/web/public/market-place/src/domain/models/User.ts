export interface User {
    id: string;
    full_name: string;
    email: string;
    password?: string; // Usually not returned in profile but good to have type def just in case
    role: "USER" | "ADMIN" | "BUYER" | "SELLER"; // Adjusting case based on example "BUYER", "ADMIN"
    phone_number: string;
    profilePicture?: string | null;
    bio?: string | null;
    createdAt: string;
    updatedAt: string;
}
