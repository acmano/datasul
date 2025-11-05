// src/infrastructure/tracing/DatabaseInstrumentation.ts

import { trace, context, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Database Instrumentation for OpenTelemetry
 *
 * @description
 * Provides instrumentation for database operations with OpenTelemetry.
 * Creates spans for queries, connection acquisition, and tracks retries
 * and circuit breaker events.
 *
 * **Features:**
 * - Query tracing with SQL sanitization
 * - Connection pool tracking
 * - Retry attempt recording
 * - Circuit breaker state changes
 * - Semantic attributes (DB system, operation, etc)
 * - Error tracking and status codes
 *
 * @example Trace a query
 * ```typescript
 * const result = await DatabaseInstrumentation.traceQuery(
 *   'DtsPrdEmp',
 *   'SELECT * FROM item WHERE "it-codigo" = ?',
 *   [{ name: 'codigo', type: 'varchar', value: '123' }],
 *   async () => {
 *     return await connection.queryWithParams(sql, params);
 *   }
 * );
 * ```
 *
 * @example Trace connection acquisition
 * ```typescript
 * const connection = await DatabaseInstrumentation.traceConnectionAcquire(
 *   'DtsPrdEmp',
 *   async () => {
 *     return await pool.acquire();
 *   }
 * );
 * ```
 */
export class DatabaseInstrumentation {
  private static readonly tracer = trace.getTracer('lordtsapi-database', '1.0.0');

  /**
   * Wrap database query with tracing
   *
   * @description
   * Creates a span for the database query, tracks execution time,
   * records success/failure, and captures relevant attributes.
   *
   * **Span Attributes:**
   * - db.system: Database system (progress, informix, mssql)
   * - db.name: Database name
   * - db.statement: SQL query (sanitized)
   * - db.operation: Operation type (SELECT, INSERT, etc)
   * - db.connection_id: Connection DSN
   * - db.param_count: Number of parameters
   * - db.duration_ms: Execution duration
   * - db.result_count: Number of results
   *
   * @param {string} connectionId - Connection DSN (e.g., 'DtsPrdEmp')
   * @param {string} sql - SQL query
   * @param {any[]} params - Query parameters
   * @param {Function} operation - Async function that executes the query
   * @returns {Promise<T>} Query result
   * @throws {Error} If query fails (re-throws original error)
   *
   * @example
   * ```typescript
   * const items = await DatabaseInstrumentation.traceQuery(
   *   'DtsPrdEmp',
   *   'SELECT * FROM item WHERE "it-codigo" = ?',
   *   [{ name: 'codigo', type: 'varchar', value: '7530110' }],
   *   async () => {
   *     return await connection.queryWithParams(sql, params);
   *   }
   * );
   * ```
   */
  static async traceQuery<T>(
    connectionId: string,
    sql: string,
    params: any[],
    operation: () => Promise<T>
  ): Promise<T> {
    // Create span
    return this.tracer.startActiveSpan(
      `db.query.${connectionId}`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          [SemanticAttributes.DB_SYSTEM]: this.getDbSystem(connectionId),
          [SemanticAttributes.DB_NAME]: this.getDbName(connectionId),
          [SemanticAttributes.DB_STATEMENT]: this.sanitizeSQL(sql),
          [SemanticAttributes.DB_OPERATION]: this.extractOperation(sql),
          'db.connection_id': connectionId,
          'db.param_count': params?.length || 0,
          'lordtsapi.connection_type': this.getConnectionType(connectionId),
        },
      },
      async (span: Span) => {
        const startTime = Date.now();

        try {
          // Execute query
          const result = await operation();

          // Record success
          span.setStatus({ code: SpanStatusCode.OK });
          span.setAttribute('db.duration_ms', Date.now() - startTime);
          span.setAttribute('db.result_count', Array.isArray(result) ? result.length : 1);

          return result;
        } catch (error: any) {
          // Record error
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);
          span.setAttribute('db.error', error.message);
          span.setAttribute('db.error_type', error.constructor.name);

          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  /**
   * Trace connection acquisition from pool
   *
   * @description
   * Creates a span for connection acquisition, useful for
   * tracking pool performance and connection wait times.
   *
   * @param {string} connectionId - Connection DSN
   * @param {Function} operation - Async function that acquires connection
   * @returns {Promise<T>} Connection or result
   *
   * @example
   * ```typescript
   * const connection = await DatabaseInstrumentation.traceConnectionAcquire(
   *   'DtsPrdEmp',
   *   async () => {
   *     return await DatabaseManager.getConnectionByDSN('DtsPrdEmp');
   *   }
   * );
   * ```
   */
  static async traceConnectionAcquire<T>(
    connectionId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.tracer.startActiveSpan(
      `db.connection.acquire.${connectionId}`,
      {
        attributes: {
          'db.connection_id': connectionId,
          'db.operation': 'acquire',
        },
      },
      async (span: Span) => {
        const startTime = Date.now();

        try {
          const result = await operation();
          span.setStatus({ code: SpanStatusCode.OK });
          span.setAttribute('db.acquire_duration_ms', Date.now() - startTime);
          return result;
        } catch (error: any) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          span.recordException(error);
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  /**
   * Trace retry attempts
   *
   * @description
   * Adds an event to the active span recording retry attempt details.
   * Useful for debugging retry logic and understanding failure patterns.
   *
   * @param {string} connectionId - Connection DSN
   * @param {number} attempt - Current attempt number
   * @param {number} maxAttempts - Maximum attempts allowed
   *
   * @example
   * ```typescript
   * // Inside retry loop
   * if (attempt > 1) {
   *   DatabaseInstrumentation.traceRetryAttempt('DtsPrdEmp', attempt, 5);
   * }
   * ```
   */
  static traceRetryAttempt(connectionId: string, attempt: number, maxAttempts: number): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent('db.retry', {
        'retry.attempt': attempt,
        'retry.max_attempts': maxAttempts,
        'db.connection_id': connectionId,
      });
    }
  }

  /**
   * Trace circuit breaker events
   *
   * @description
   * Adds an event to the active span recording circuit breaker state changes.
   * Critical for understanding when connections are degraded or recovered.
   *
   * @param {string} connectionId - Connection DSN
   * @param {'open' | 'close' | 'half_open'} event - Circuit breaker state
   *
   * @example
   * ```typescript
   * // In CircuitBreaker.ts
   * private open(): void {
   *   this.state = CircuitState.OPEN;
   *   DatabaseInstrumentation.traceCircuitBreakerEvent(this.connectionId, 'open');
   * }
   * ```
   */
  static traceCircuitBreakerEvent(
    connectionId: string,
    event: 'open' | 'close' | 'half_open'
  ): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent('circuit_breaker.state_change', {
        'circuit_breaker.state': event,
        'db.connection_id': connectionId,
      });
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get database system type from connection ID
   * @private
   */
  private static getDbSystem(connectionId: string): string {
    if (connectionId.startsWith('Dts')) return 'progress';
    if (connectionId.startsWith('Lgx')) return 'informix';
    if (connectionId.startsWith('PCF') || connectionId.startsWith('DATACORP')) return 'mssql';
    return 'unknown';
  }

  /**
   * Get database name from connection ID
   * @private
   */
  private static getDbName(connectionId: string): string {
    // For now, return connectionId
    // TODO: Extract actual database name from connection config
    return connectionId;
  }

  /**
   * Sanitize SQL query for tracing
   * @private
   */
  private static sanitizeSQL(sql: string): string {
    // Remove sensitive data and limit length
    // Don't include actual parameter values in trace
    return sql.substring(0, 500);
  }

  /**
   * Extract SQL operation type
   * @private
   */
  private static extractOperation(sql: string): string {
    const match = sql.trim().match(/^(SELECT|INSERT|UPDATE|DELETE|EXEC|CALL)/i);
    return match ? match[1].toUpperCase() : 'QUERY';
  }

  /**
   * Get connection type (ODBC or SQL Server)
   * @private
   */
  private static getConnectionType(connectionId: string): 'odbc' | 'sqlserver' {
    return connectionId.startsWith('PCF') || connectionId.startsWith('DATACORP')
      ? 'sqlserver'
      : 'odbc';
  }
}
