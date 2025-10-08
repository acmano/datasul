// src/shared/utils/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

/**
 * Sistema de Logging com Winston
 * @module Logger
 */

// Diretório de logs
const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato JSON para arquivos
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato colorido para console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;

    const contextKeys = Object.keys(meta).filter(
      key => !['level', 'message', 'timestamp', 'splat'].includes(key)
    );

    if (contextKeys.length > 0) {
      const context = contextKeys.reduce((obj, key) => {
        obj[key] = meta[key];
        return obj;
      }, {} as Record<string, any>);

      msg += ` ${JSON.stringify(context)}`;
    }

    return msg;
  })
);

// Transportes
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),
];

// Adiciona transportes de arquivo (exceto em testes)
if (process.env.NODE_ENV !== 'test') {
  // Arquivo de erros
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })
  );

  // Arquivo de todos os logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );
}

// Logger Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * Interface para contexto estruturado
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  itemCodigo?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * API pública do logger
 */
export const log = {
  /**
   * Registra erro crítico
   */
  error: (message: string, context?: LogContext) => {
    logger.error(message, context);
  },

  /**
   * Registra aviso
   */
  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },

  /**
   * Registra informação geral
   */
  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },

  /**
   * Registra requisição HTTP
   */
  http: (message: string, context?: LogContext) => {
    logger.http(message, context);
  },

  /**
   * Registra informação de debug
   */
  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  },
};

export default logger;