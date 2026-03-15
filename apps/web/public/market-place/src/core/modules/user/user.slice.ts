import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserState } from "./user.types";
import { setJWT, clearJWT } from "./user.storage";
import { User } from "@/domain/models/User";

const initialState: UserState = {
    user: null,
    jwt: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload;
        },

        setToken(state, action: PayloadAction<string>) {
            state.jwt = action.payload;
            setJWT(action.payload);
        },

        logout(state) {
            state.user = null;
            state.jwt = null;
            clearJWT();
        },
    },
});

export const { setUser, setToken, logout } = userSlice.actions;
export default userSlice.reducer;
