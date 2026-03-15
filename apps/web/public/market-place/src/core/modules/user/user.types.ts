import { User } from "@/domain/models/User";

export interface UserState {
    user: User | null;
    jwt: string | null;
}
