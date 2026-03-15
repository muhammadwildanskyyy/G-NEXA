import { RootState } from "@/core/store";

export const selectUser = (state: RootState) => state.user.user;
export const selectJWT = (state: RootState) => state.user.jwt;
