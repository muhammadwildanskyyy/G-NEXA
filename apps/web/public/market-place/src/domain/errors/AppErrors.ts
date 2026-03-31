export class AppError extends Error {
    constructor(public message: string, public statusCode?: number, public code?: string) {
        super(message);
        this.name = "AppError";
    }
}

export class NetworkError extends AppError {
    constructor(message = "Network error occurred") {
        super(message, 503, "NETWORK_ERROR");
    }
}

export class AuthError extends AppError {
    constructor(message = "Authentication failed") {
        super(message, 401, "AUTH_ERROR");
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}
