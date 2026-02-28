import * as winston from 'winston';
import chalk from 'chalk';
import { als } from './als';

chalk.level = 2;
const getTraceId = (): string | undefined => {
  const store = als.getStore();
  return store ? store.get('trace_id') : undefined;
};

// 1. Definisikan tipe log yang jelas (Gunakan unknown, bukan any)
interface GNEXALogInfo extends winston.Logform.TransformableInfo {
  timestamp?: string;
  layer?: string;
  [key: string]: unknown;
}

const customFormat = winston.format.printf(
  (info: winston.Logform.TransformableInfo) => {
    // 2. Casting yang aman (Safe Type Casting)
    const typedInfo = info as GNEXALogInfo;
    const level = String(typedInfo.level);
    const message = String(typedInfo.message);
    const timestamp = String(typedInfo.timestamp || '');
    const layer = String(typedInfo.layer || 'APP');

    // 3. Pisahkan metadata dengan aman
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      level: _l,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      message: _m,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      timestamp: _t,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layer: _layer,
      ...meta
    } = typedInfo;

    const timeStr = chalk.gray(`[${timestamp}]`);

    // Karena level sudah pasti string, toUpperCase() sekarang 100% aman
    let levelStr = level.toUpperCase().padEnd(5);
    switch (level) {
      case 'info':
        levelStr = chalk.green.bold(levelStr);
        break;
      case 'warn':
        levelStr = chalk.yellow.bold(levelStr);
        break;
      case 'error':
        levelStr = chalk.red.bold(levelStr);
        break;
      case 'debug':
        levelStr = chalk.blue.bold(levelStr);
        break;
    }

    const serviceStr = chalk.magenta('[order-service]');
    const layerStr = chalk.cyan(`[${layer.toUpperCase()}]`);

    const traceId = getTraceId();
    const traceStr = traceId ? chalk.yellow(`[${traceId}] `) : '';

    let logStr = `${timeStr} ${levelStr} ${serviceStr} ${layerStr} ${traceStr}: ${message}`;

    if (Object.keys(meta).length > 0) {
      // Stringify sekarang aman karena kita sudah mendefinisikan bentuk meta
      const metaStr = JSON.stringify(meta, Object.keys(meta).sort());
      if (metaStr !== '{}') {
        logStr += `\n        ${chalk.gray('->')} ${chalk.gray(metaStr)}`;
      }
    }

    return logStr;
  },
);

export const winstonLogger = winston.createLogger({
  level: process.env.APP_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    customFormat,
  ),
  transports: [new winston.transports.Console()],
});
