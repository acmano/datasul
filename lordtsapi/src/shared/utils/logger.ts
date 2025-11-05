// @ts-nocheck
// src/shared/utils/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getElasticsearchClient, getElasticsearchConfig } from '@config/elasticsearch.config';

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
      (key) => !['level', 'message', 'timestamp', 'splat'].includes(key)
    );

    if (contextKeys.length > 0) {
      const context = contextKeys.reduce(
        (obj, key) => {
          obj[key] = meta[key];
          return obj;
        },
        {} as Record<string, unknown>
      );

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

  // Elasticsearch transport (se habilitado)
  const esConfig = getElasticsearchConfig();
  if (esConfig.enabled) {
    const esClient = getElasticsearchClient();
    if (esClient) {
      transports.push(
        new ElasticsearchTransport({
          level: process.env.LOG_LEVEL || 'info', // Envia todos os logs (debug, info, warn, error)
          client: esClient,
          indexPrefix: esConfig.indexPrefix,
          indexSuffixPattern: 'YYYY.MM.DD',
          dataStream: false,
          transformer: (logData: any) => {
            // Função para achatar objetos aninhados em strings JSON
            const flattenValue = (value: any, maxDepth = 2, currentDepth = 0): any => {
              // Valores primitivos retornam direto
              if (value === null || value === undefined) {
                return null;
              }
              if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
              ) {
                return value;
              }
              if (value instanceof Date) {
                return value.toISOString();
              }

              // Se chegou na profundidade máxima ou é símbolo, converte para string
              if (currentDepth >= maxDepth || typeof value === 'symbol') {
                try {
                  return JSON.stringify(value);
                } catch {
                  return String(value);
                }
              }

              // Arrays e objetos: converte para JSON string (evita aninhamento no ES)
              if (Array.isArray(value) || typeof value === 'object') {
                try {
                  return JSON.stringify(value);
                } catch {
                  return String(value);
                }
              }

              return String(value);
            };

            // Processa metadados
            const cleanMeta: Record<string, any> = {};
            if (logData.meta && typeof logData.meta === 'object') {
              for (const key of Object.keys(logData.meta)) {
                // Ignora símbolos e propriedades internas
                if (typeof key === 'string' && !key.startsWith('Symbol(')) {
                  const value = logData.meta[key];
                  cleanMeta[key] = flattenValue(value);
                }
              }
            }

            return {
              '@timestamp': new Date().toISOString(),
              severity: logData.level,
              message: logData.message || '',
              fields: {
                ...cleanMeta,
                application: 'lordtsapi',
                environment: process.env.NODE_ENV || 'development',
                hostname: os.hostname(),
              },
            };
          },
        })
      );
    }
  }
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
  [key: string]: unknown;
}

/**
 * Interface para log do frontend
 */
export interface FrontendLogPayload {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

/**
 * Logger separado para logs do frontend
 * Usa índice Elasticsearch diferente (lor0138-logs-*)
 */
let frontendLogger: winston.Logger | null = null;

/**
 * Inicializa logger específico para frontend (lazy initialization)
 */
function getFrontendLogger(): winston.Logger {
  if (frontendLogger) {
    return frontendLogger;
  }

  const frontendTransports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}] [FRONTEND] ${message} ${JSON.stringify(meta)}`;
        })
      ),
      level: process.env.LOG_LEVEL || 'info',
    }),
  ];

  // Adiciona transporte Elasticsearch para frontend (índice separado)
  if (process.env.NODE_ENV !== 'test') {
    const esConfig = getElasticsearchConfig();
    if (esConfig.enabled) {
      const esClient = getElasticsearchClient();
      if (esClient) {
        frontendTransports.push(
          new ElasticsearchTransport({
            level: process.env.LOG_LEVEL || 'info',
            client: esClient,
            indexPrefix: 'lor0138-logs', // Índice separado para frontend
            indexSuffixPattern: 'YYYY.MM.DD',
            dataStream: false,
            transformer: (logData: any) => {
              const flattenValue = (value: any): any => {
                if (value === null || value === undefined) return null;
                if (
                  typeof value === 'string' ||
                  typeof value === 'number' ||
                  typeof value === 'boolean'
                ) {
                  return value;
                }
                if (value instanceof Date) return value.toISOString();
                if (Array.isArray(value) || typeof value === 'object') {
                  try {
                    return JSON.stringify(value);
                  } catch {
                    return String(value);
                  }
                }
                return String(value);
              };

              const cleanMeta: Record<string, any> = {};
              if (logData.meta && typeof logData.meta === 'object') {
                for (const key of Object.keys(logData.meta)) {
                  if (typeof key === 'string' && !key.startsWith('Symbol(')) {
                    cleanMeta[key] = flattenValue(logData.meta[key]);
                  }
                }
              }

              return {
                '@timestamp': new Date().toISOString(),
                severity: logData.level,
                message: logData.message || '',
                fields: {
                  ...cleanMeta,
                  application: 'lor0138', // Identifica frontend
                  source: 'frontend',
                  environment: process.env.NODE_ENV || 'development',
                  hostname: os.hostname(),
                },
              };
            },
          })
        );
      }
    }
  }

  frontendLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: frontendTransports,
    exitOnError: false,
  });

  return frontendLogger;
}

/**
 * Registra log enviado pelo frontend
 *
 * @param payload - Dados do log do frontend
 *
 * @example
 * ```ts
 * logFromFrontend({
 *   level: 'error',
 *   message: 'Failed to load user data',
 *   context: { userId: '123', component: 'UserProfile' },
 *   correlationId: 'abc-123',
 *   timestamp: '2023-10-25T10:30:00.000Z',
 *   url: '/app/users/123',
 *   userAgent: 'Mozilla/5.0...'
 * });
 * ```
 */
export function logFromFrontend(payload: FrontendLogPayload): void {
  const logger = getFrontendLogger();

  const context: LogContext = {
    source: 'frontend',
    correlationId: payload.correlationId,
    url: payload.url,
    userAgent: payload.userAgent,
    timestamp: payload.timestamp,
    ...payload.context,
  };

  // Registra no nível apropriado
  switch (payload.level) {
    case 'error':
      logger.error(`[FRONTEND] ${payload.message}`, context);
      break;
    case 'warn':
      logger.warn(`[FRONTEND] ${payload.message}`, context);
      break;
    case 'info':
      logger.info(`[FRONTEND] ${payload.message}`, context);
      break;
    case 'debug':
      logger.debug(`[FRONTEND] ${payload.message}`, context);
      break;
    default:
      logger.info(`[FRONTEND] ${payload.message}`, context);
  }
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
