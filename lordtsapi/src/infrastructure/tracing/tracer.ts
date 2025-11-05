// src/infrastructure/tracing/tracer.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { log } from '@shared/utils/logger';

/**
 * OpenTelemetry Tracer Configuration
 *
 * @description
 * Configures and initializes OpenTelemetry SDK for distributed tracing.
 * Supports multiple exporters (Jaeger, OTLP) and auto-instrumentation
 * for HTTP, Express, and other Node.js frameworks.
 *
 * **Features:**
 * - Auto-instrumentation for HTTP/Express
 * - Multiple exporter support (Jaeger, OTLP)
 * - Service metadata (name, version, environment)
 * - Graceful shutdown handling
 * - Environment-based configuration
 *
 * @example Initialize tracing
 * ```typescript
 * import { startTracing } from '@infrastructure/tracing/tracer';
 *
 * // Before Express app creation
 * startTracing();
 * ```
 *
 * @example Environment variables
 * ```bash
 * OTEL_ENABLED=true
 * OTEL_EXPORTER_TYPE=jaeger
 * JAEGER_ENDPOINT=http://localhost:14268/api/traces
 * OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
 * ```
 */

// Configure resource with service metadata
// NOTE: Resource is disabled due to OpenTelemetry version incompatibility
// TODO: Update OpenTelemetry packages to compatible versions
const resource = undefined;
// try {
//   resource = new Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]: 'lordtsapi',
//     [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
//     [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
//   });
// } catch (error) {
//   // Fallback if Resource is not available
//   log.warn('OpenTelemetry Resource not available, tracing will be limited');
//   resource = undefined;
// }

/**
 * Get trace exporter based on configuration
 *
 * @description
 * Returns the appropriate trace exporter based on OTEL_EXPORTER_TYPE.
 * Supports Jaeger and OTLP exporters with configurable endpoints.
 *
 * @returns {JaegerExporter | OTLPTraceExporter} Configured exporter
 * @throws {Error} If exporter type is unknown
 *
 * @private
 */
function getExporter(): JaegerExporter | OTLPTraceExporter {
  const exporterType = process.env.OTEL_EXPORTER_TYPE || 'jaeger';

  if (exporterType === 'jaeger') {
    const endpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
    log.info('Using Jaeger exporter', { endpoint });

    return new JaegerExporter({
      endpoint,
    });
  } else if (exporterType === 'otlp') {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
    log.info('Using OTLP exporter', { endpoint });

    return new OTLPTraceExporter({
      url: endpoint,
    });
  }

  throw new Error(`Unknown exporter type: ${exporterType}. Use 'jaeger' or 'otlp'`);
}

// Initialize SDK
let sdk: NodeSDK | undefined;
try {
  sdk = new NodeSDK({
    resource: resource || undefined,
    traceExporter: getExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Auto-instrument HTTP
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          // NOTE: ignoreIncomingPaths removed due to API changes
          // TODO: Update to use correct API for filtering paths
        },
        // Auto-instrument Express
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
      }),
    ],
  });
} catch (error) {
  log.warn('OpenTelemetry SDK initialization failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  sdk = undefined;
}

/**
 * Start OpenTelemetry tracing
 *
 * @description
 * Initializes the OpenTelemetry SDK with configured exporter and
 * auto-instrumentations. Sets up graceful shutdown on SIGTERM.
 *
 * **Important:**
 * - Must be called BEFORE Express app creation
 * - Respects OTEL_ENABLED environment variable
 * - Registers SIGTERM handler for graceful shutdown
 *
 * @example
 * ```typescript
 * // In server.ts or app.ts - BEFORE creating Express app
 * import { startTracing } from '@infrastructure/tracing/tracer';
 *
 * startTracing();
 *
 * const app = express();
 * // ... rest of app setup
 * ```
 *
 * @critical
 * - Call BEFORE creating Express app
 * - Only works if OTEL_ENABLED=true
 * - Registers global SIGTERM handler
 */
export function startTracing(): void {
  if (process.env.OTEL_ENABLED !== 'true') {
    log.info('OpenTelemetry tracing is disabled (OTEL_ENABLED != true)');
    return;
  }

  if (!sdk) {
    log.warn('OpenTelemetry SDK not available, tracing will not start');
    return;
  }

  try {
    sdk.start();
    log.info('OpenTelemetry tracing started', {
      exporter: process.env.OTEL_EXPORTER_TYPE || 'jaeger',
      serviceName: 'lordtsapi',
      environment: process.env.NODE_ENV || 'development',
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      log.info('Shutting down OpenTelemetry tracing...');
      try {
        if (sdk) {
          await sdk.shutdown();
          log.info('OpenTelemetry tracing terminated successfully');
        }
      } catch (error) {
        log.error('Error terminating tracing', { error });
      } finally {
        process.exit(0);
      }
    });
  } catch (error) {
    log.error('Failed to start OpenTelemetry tracing', { error });
    // Don't throw - allow app to continue without tracing
  }
}

/**
 * Export SDK for testing and manual control
 */
export { sdk as tracingSDK };
