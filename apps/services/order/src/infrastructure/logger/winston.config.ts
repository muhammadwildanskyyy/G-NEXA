import * as winston from 'winston';

// Deteksi environment
const isProduction = process.env.NODE_ENV === 'production';

export const winstonInstance = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'gnexa-api-gateway' },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize({ all: true }),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const ctx = context ? `[${context}] ` : '';
                const metaString = Object.keys(meta).length
                  ? JSON.stringify(meta)
                  : '';
                return `${timestamp} ${level}: ${ctx}${message} ${metaString}`;
              },
            ),
          ),
    }),

    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});
