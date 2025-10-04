// src/shared/utils/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const logDir = 'logs';

// Cria diretório de logs se não existir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formatos customizados
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transportes (onde os logs vão)
const transports: winston.transport[] = [
  // Console (sempre ativo)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),
];

// ✅ MUDANÇA: Logs em arquivo também em desenvolvimento
if (process.env.NODE_ENV !== 'test') {
  // Logs de erro em arquivo separado
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

  // Todos os logs combinados
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

// Cria o logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

// Helper para adicionar contexto às mensagens
export interface LogContext {
  requestId?: string;
  userId?: string;
  itemCodigo?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

// Funções auxiliares tipadas
export const log = {
  error: (message: string, context?: LogContext) => {
    logger.error(message, context);
  },

  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },

  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },

  http: (message: string, context?: LogContext) => {
    logger.http(message, context);
  },

  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  },
};

export default logger;