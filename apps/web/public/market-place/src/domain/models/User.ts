export interface User {
    id: string;
    fullName: string;
    email: string;
    password?: string; // Usually not returned in profile but good to have type def just in case
    role: 'uSER' | 'ADMIN' | 'BUYER' | 'SELLER'; // Adjusting case based on example "BUYER", "ADMIN"
    phoneNumber: string;
    profilePicture?: string | null;
    bio?: string | null;
    createdAt: string;
    updatedAt: string;
}
