// src/shared/middlewares/tracing.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

/**
 * Tracing Middleware
 *
 * @description
 * Express middleware that creates OpenTelemetry spans for HTTP requests.
 * Enriches spans with request metadata (method, URL, correlation ID) and
 * response metadata (status code).
 *
 * **Features:**
 * - Creates root span for each HTTP request
 * - Propagates context to downstream operations
 * - Records request/response metadata
 * - Handles errors gracefully
 *
 * **Important:**
 * - Must be registered AFTER correlationIdMiddleware
 * - Must be registered BEFORE route handlers
 * - Automatically ends span on response finish
 *
 * @example
 * ```typescript
 * // In app.ts
 * import { tracingMiddleware } from '@shared/middlewares/tracing.middleware';
 *
 * // After correlation ID middleware
 * app.use(correlationIdMiddleware);
 * app.use(tracingMiddleware);
 * ```
 */
export const tracingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const tracer = trace.getTracer('lordtsapi-http');

  // Create root span for request
  const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.target': req.path,
      'http.user_agent': req.get('user-agent') || 'unknown',
      'correlation.id': req.id || 'unknown',
    },
  });

  // Continue in context with this span
  context.with(trace.setSpan(context.active(), span), () => {
    // End span when response finishes
    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);

      // Set span status based on HTTP status code
      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    });

    // Handle response errors
    res.on('error', (error: Error) => {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.end();
    });

    next();
  });
};
