// src/shared/tracing/tracing.controller.ts

/**
 * Distributed Tracing HTTP API Controller
 *
 * @description
 * REST API for managing distributed tracing system.
 * Allows viewing trace status, configuring sampling, and accessing trace information.
 *
 * @module TracingController
 * @since 2.0.0
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

/**
 * Tracing Controller
 *
 * @class TracingController
 */
export class TracingController {
  /**
   * GET /tracing/status
   * Get distributed tracing system status
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = {
      enabled: process.env.TRACING_ENABLED === 'true',
      active: true,
      serviceName: process.env.TRACING_SERVICE_NAME || 'lordtsapi',
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      tracing: status,
      correlationId: req.id,
    });
  });

  /**
   * GET /tracing/config
   * Get current tracing configuration
   */
  static getConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = {
      enabled: process.env.TRACING_ENABLED === 'true',
      jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      serviceName: process.env.TRACING_SERVICE_NAME || 'lordtsapi',
      samplingRate: parseFloat(process.env.TRACING_SAMPLING_RATE || '1.0'),
      environment: process.env.NODE_ENV || 'development',
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      config,
      correlationId: req.id,
    });
  });

  /**
   * GET /tracing/current
   * Get current active span information (if any)
   */
  static getCurrentSpan = asyncHandler(async (req: Request, res: Response) => {
    const currentSpan = trace.getActiveSpan();

    if (!currentSpan) {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'No active span in current context',
        hasActiveSpan: false,
        correlationId: req.id,
      });
      return;
    }

    const spanContext = currentSpan.spanContext();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      hasActiveSpan: true,
      span: {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
      },
      correlationId: req.id,
    });
  });

  /**
   * POST /tracing/test
   * Create a test trace to verify tracing is working
   */
  static testTrace = asyncHandler(async (req: Request, res: Response) => {
    const tracer = trace.getTracer('test-tracer');

    return tracer.startActiveSpan('test-endpoint', async (span) => {
      try {
        span.setAttribute('http.method', 'POST');
        span.setAttribute('http.route', '/tracing/test');
        span.setAttribute('test.correlation_id', req.id);

        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 100));

        span.addEvent('Test trace completed successfully');
        span.setStatus({ code: SpanStatusCode.OK });

        const spanContext = span.spanContext();

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          message: 'Test trace created successfully',
          trace: {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
            jaegerUrl: `${process.env.JAEGER_UI_URL || 'http://localhost:16686'}/trace/${spanContext.traceId}`,
          },
          correlationId: req.id,
        });
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    });
  });

  /**
   * GET /tracing/metrics
   * Get tracing metrics (spans created, exported, etc.)
   */
  static getMetrics = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement metrics collection from tracer
    // For now, return placeholder
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        spansCreated: 0,
        spansExported: 0,
        spansFailed: 0,
        averageSpanDuration: 0,
        message: 'Metrics collection not yet implemented',
      },
      correlationId: req.id,
    });
  });
}
