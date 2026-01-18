import winston from "winston";

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  // Kita set level ke 'info' sebagai standar global
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Otomatis menangkap stack trace jika ada
    json(), // Format JSON untuk semua environment
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});
