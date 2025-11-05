// @ts-nocheck
/**
 * Sentry Integration - Error Tracking & Performance Monitoring
 *
 * Setup:
 * 1. npm install @sentry/node @sentry/tracing
 * 2. Configurar SENTRY_DSN no .env
 * 3. Importar initSentry() no início do app
 *
 * NOTA: Sentry é opcional - se não estiver instalado, o módulo funciona em modo degradado
 */

import { Application, Request, Response, NextFunction } from 'express';
import { log } from '@shared/utils/logger';

// Conditional import para Sentry (módulo opcional)
let Sentry: any;
let Tracing: any;
try {
  Sentry = require('@sentry/node');
  Tracing = require('@sentry/tracing');
} catch (e) {
  log.warn(
    'Sentry não instalado - error tracking desabilitado. Execute: npm install @sentry/node @sentry/tracing'
  );
}

/**
 * Inicializa Sentry com configurações otimizadas
 */
export function initSentry(app: Application): void {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    log.warn('SENTRY_DSN não configurado - Error tracking desabilitado');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      release: `lordtsapi@${process.env.npm_package_version}`,

      // Performance Monitoring
      tracesSampleRate:
        process.env.NODE_ENV === 'production'
          ? 0.1 // 10% em produção (economiza quota)
          : 1.0, // 100% em dev

      // Integrations
      integrations: [
        // HTTP tracking automático
        new Sentry.Integrations.Http({ tracing: true }),

        // Express tracking
        new Tracing.Integrations.Express({ app }),

        // Database tracking (se usar Postgres)
        // new Tracing.Integrations.Postgres(),
      ],

      // Filtros de dados sensíveis
      beforeSend(event, hint) {
        // Remove informações sensíveis
        if (event.request) {
          // Remove cookies
          delete event.request.cookies;

          // Remove headers sensíveis
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers['x-api-key'];
            delete event.request.headers.cookie;
          }

          // Remove query params sensíveis
          if (event.request.query_string) {
            const sanitized = event.request.query_string
              .replace(/password=[^&]*/gi, 'password=[REDACTED]')
              .replace(/token=[^&]*/gi, 'token=[REDACTED]')
              .replace(/api[-_]?key=[^&]*/gi, 'api_key=[REDACTED]');
            event.request.query_string = sanitized;
          }
        }

        // Remove dados sensíveis do contexto
        if (event.contexts) {
          if (event.contexts.user) {
            delete event.contexts.user.ip_address;
          }
        }

        // Log localmente também
        log.error('Error sent to Sentry', {
          eventId: event.event_id,
          level: event.level,
          message: event.message,
        });

        return event;
      },

      // Ignora erros conhecidos/esperados
      ignoreErrors: [
        // Erros de rede do cliente
        'NetworkError',
        'Network request failed',

        // Rate limiting (esperado)
        'Rate limit excedido',

        // Timeouts (podem ser esperados)
        'Request timeout',

        // Erros de validação (não são bugs)
        'ValidationError',
      ],

      // Sample rate para error reporting
      sampleRate: 1.0, // 100% dos erros
    });

    log.info('✅ Sentry initialized', {
      environment: process.env.NODE_ENV,
      release: `lordtsapi@${process.env.npm_package_version}`,
    });
  } catch (error) {
    log.error('Failed to initialize Sentry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Request handler middleware (DEVE vir ANTES das rotas)
 */
export function sentryRequestHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Tracing middleware (DEVE vir DEPOIS do requestHandler)
 */
export function sentryTracingHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Error handler middleware (DEVE vir DEPOIS das rotas, ANTES do error handler geral)
 */
export function sentryErrorHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return Sentry.Handlers.errorHandler({
    shouldHandleError(error: any) {
      // Apenas erros 5xx (server errors)
      // Não reporta 4xx (client errors)
      const statusCode = error.statusCode || error.status || 500;
      return statusCode >= 500;
    },
  });
}

/**
 * Captura exceção manualmente com contexto adicional
 */
export function captureException(
  error: Error,
  context?: {
    correlationId?: string;
    userId?: string;
    extra?: Record<string, any>;
    tags?: Record<string, string>;
  }
): string {
  if (!process.env.SENTRY_DSN) {
    return 'sentry-disabled';
  }

  Sentry.withScope((scope) => {
    // Adiciona correlation ID
    if (context?.correlationId) {
      scope.setTag('correlation_id', context.correlationId);
    }

    // Adiciona user ID
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    // Adiciona tags customizadas
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Adiciona contexto extra
    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureException(error);
  });

  return Sentry.lastEventId() || 'unknown';
}

/**
 * Captura mensagem (não erro) com severidade
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: {
    correlationId?: string;
    extra?: Record<string, any>;
  }
): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.correlationId) {
      scope.setTag('correlation_id', context.correlationId);
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Cria transaction para performance monitoring manual
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({
    op,
    name,
  });
}

/**
 * Adiciona breadcrumb (rastro de eventos)
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Configura contexto de usuário
 */
export function setUser(userId: string, email?: string, username?: string): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Remove contexto de usuário (logout)
 */
export function clearUser(): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Flush events para Sentry (usado antes de shutdown)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!process.env.SENTRY_DSN) {
    return true;
  }

  try {
    const flushed = await Sentry.flush(timeout);
    log.info('Sentry events flushed', { success: flushed });
    return flushed;
  } catch (error) {
    log.error('Failed to flush Sentry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Fecha conexão com Sentry
 */
export async function closeSentry(): Promise<void> {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    await Sentry.close(2000);
    log.info('Sentry closed');
  } catch (error) {
    log.error('Failed to close Sentry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export do Sentry para uso direto se necessário
export { Sentry };
