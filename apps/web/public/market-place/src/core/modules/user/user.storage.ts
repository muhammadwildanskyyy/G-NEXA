let JWT_TOKEN: string | null = null;

export function setJWT(token: string) {
    JWT_TOKEN = token;

    if (typeof window !== "undefined") {
        localStorage.setItem("jwt", token);
    }
}

export function getJWT(): string | null {
    if (JWT_TOKEN) return JWT_TOKEN;

    if (typeof window !== "undefined") {
        JWT_TOKEN = localStorage.getItem("jwt");
    }

    return JWT_TOKEN;
}

export function clearJWT() {
    JWT_TOKEN = null;

    if (typeof window !== "undefined") {
        localStorage.removeItem("jwt");
    }
}
