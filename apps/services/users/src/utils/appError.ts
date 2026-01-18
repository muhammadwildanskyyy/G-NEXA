export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // Tambahkan ini

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Set default ke true untuk error yang kita buat sengaja

    Error.captureStackTrace(this, this.constructor);
  }
}
