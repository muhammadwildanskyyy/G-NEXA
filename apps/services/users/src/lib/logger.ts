import { AsyncLocalStorage } from "node:async_hooks";
import chalk from "chalk";

import winston from "winston";

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Format khusus untuk Development (Lokal) agar enak dibaca mata
winston.addColors({ error: 'red', warn: 'yellow', info: 'green', debug: 'blue' });

// 1. Buat pemetaan warna manual untuk Level
const colorizeLevel = (level: string) => {
  const text = level.toUpperCase();
  switch (level.toLowerCase()) {
    case 'error': return chalk.red.bold(text);
    case 'warn': return chalk.yellow.bold(text);
    case 'info': return chalk.green.bold(text);
    case 'debug': return chalk.blue.bold(text);
    default: return chalk.white.bold(text);
  }
};

const devFormat = printf(({ level, message, timestamp, stack, trace_id, layer, ...metadata }) => {
  // 2. Warnai semua elemen secara eksplisit pakai Chalk
  const timeStr = chalk.gray(`[${timestamp}]`);
  const levelStr = colorizeLevel(level); // Warna manual dari fungsi di atas
  const serviceStr = chalk.magenta(`[user-service]`);
  const layerStr = chalk.cyan(`[${layer || 'APP'}]`);
  const traceStr = trace_id ? chalk.yellow(`[${trace_id}]`) : '';

  // Gabungkan semuanya
  let log = `${timeStr} ${levelStr} ${serviceStr} ${layerStr} ${traceStr} : ${message}`;

  // 3. Tambahkan metadata tanpa properti internal
  const cleanMeta = { ...metadata };
  delete cleanMeta.service;

  const metaString = JSON.stringify(cleanMeta);
  if (metaString && metaString !== "{}") {
    log += chalk.blue(`\n        -> ${metaString}`);
  }

  if (stack) {
    log += chalk.red(`\n${stack}`);
  }

  return log;
});

 const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  defaultMeta: { service: "user-service" },
  format: combine(
      timestamp({ format: "HH:mm:ss" }),
      errors({ stack: true }),
      // HAPUS colorize() di sini, langsung pakai devFormat
      process.env.NODE_ENV === "production" ? json() : devFormat
  ),
  transports: [new winston.transports.Console()],
});


interface RequestContext {
  traceId: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();


export const log = {
  info: (layer: string, message: string, meta: any = {}) => {
    const ctx = requestContext.getStore();
    logger.info(message, { layer, trace_id: ctx?.traceId, user_id: ctx?.userId, ...meta });
  },
  error: (layer: string, message: string, error?: any, meta: any = {}) => {
    const ctx = requestContext.getStore();
    logger.error(message, { layer, trace_id: ctx?.traceId, user_id: ctx?.userId, error_details: error?.message, stack: error?.stack, ...meta });
  },
  debug: (layer: string, message: string, meta: any = {}) => {
    const ctx = requestContext.getStore();
    logger.debug(message, { layer, trace_id: ctx?.traceId, user_id: ctx?.userId, ...meta });
  },
  warn: (layer: string, message: string, meta: any = {}) => {
    const ctx = requestContext.getStore();
    logger.info(message, { layer, trace_id: ctx?.traceId, user_id: ctx?.userId, ...meta });
  },
};