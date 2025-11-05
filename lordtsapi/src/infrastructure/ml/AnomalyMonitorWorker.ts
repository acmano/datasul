// src/infrastructure/ml/AnomalyMonitorWorker.ts

/**
 * @fileoverview Anomaly Monitoring Background Worker
 *
 * Continuously monitors all database connections for anomalous behavior.
 * Runs in background collecting metrics, detecting anomalies, and emitting alerts.
 *
 * Features:
 * - Continuous monitoring (configurable interval)
 * - Automatic metric collection
 * - Anomaly detection and alerting
 * - Health scoring
 * - Critical anomaly handling
 *
 * @module infrastructure/ml/AnomalyMonitorWorker
 */

import { anomalyMonitor, AnomalyDetection, AnomalyMetrics } from './ConnectionAnomalyMonitor';
import { AnomalyStorage } from './AnomalyStorage';
import { connectionMetrics } from '@infrastructure/metrics/ConnectionMetrics';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';
import { log } from '@shared/utils/logger';
import { findConnectionByDSN, AVAILABLE_CONNECTIONS } from '@config/connections.config';

/**
 * Anomaly Monitor Worker
 *
 * @description
 * Background worker that monitors all database connections for anomalies.
 * Collects metrics, runs anomaly detection, and handles alerts.
 *
 * @example
 * ```typescript
 * const worker = new AnomalyMonitorWorker();
 *
 * // Start monitoring
 * worker.start();
 *
 * // Stop monitoring
 * await worker.stop();
 * ```
 *
 * @class AnomalyMonitorWorker
 */
export class AnomalyMonitorWorker {
  private interval: NodeJS.Timeout | null = null;
  private storage: AnomalyStorage;
  private isRunning = false;

  /**
   * Check interval in milliseconds (default: 1 minute)
   */
  private readonly checkIntervalMs: number;

  /**
   * Whether anomaly detection is enabled
   */
  private readonly enabled: boolean;

  constructor() {
    this.storage = new AnomalyStorage();
    this.checkIntervalMs = parseInt(process.env.ML_ANOMALY_CHECK_INTERVAL || '60000', 10) || 60000;
    this.enabled = process.env.ML_ANOMALY_DETECTION_ENABLED !== 'false';

    if (!this.enabled) {
      log.info('Anomaly detection is disabled');
    }
  }

  /**
   * Start the monitoring worker
   *
   * @example
   * ```typescript
   * worker.start();
   * console.log('Anomaly monitoring started');
   * ```
   */
  start(): void {
    if (!this.enabled) {
      log.info('Anomaly detection worker not started (disabled)');
      return;
    }

    if (this.isRunning) {
      log.warn('Anomaly detection worker already running');
      return;
    }

    this.isRunning = true;

    log.info('Starting anomaly detection worker', {
      checkInterval: `${this.checkIntervalMs}ms`,
    });

    // Run immediately
    this.checkAllConnections().catch((error) => {
      log.error('Error in initial anomaly check', { error });
    });

    // Then run periodically
    this.interval = setInterval(() => {
      this.checkAllConnections().catch((error) => {
        log.error('Error in periodic anomaly check', { error });
      });
    }, this.checkIntervalMs);

    log.info('Anomaly detection worker started successfully');
  }

  /**
   * Stop the monitoring worker
   *
   * @example
   * ```typescript
   * await worker.stop();
   * console.log('Monitoring stopped');
   * ```
   */
  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;

    await this.storage.stop();

    log.info('Anomaly detection worker stopped');
  }

  /**
   * Check all connections for anomalies
   */
  private async checkAllConnections(): Promise<void> {
    const connectionIds = this.getAllConnectionIds();

    log.debug('Checking all connections for anomalies', {
      totalConnections: connectionIds.length,
    });

    for (const connectionId of connectionIds) {
      try {
        await this.checkConnection(connectionId);
      } catch (error) {
        log.error('Error checking connection', {
          connectionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Check a single connection for anomalies
   */
  private async checkConnection(connectionId: string): Promise<void> {
    // Get current metrics from ConnectionMetrics
    const metrics = connectionMetrics.getConnectionMetrics(connectionId);

    // Prepare metrics for anomaly detection
    const currentMetrics: AnomalyMetrics = {
      latency: metrics.latencyP95,
      throughput: metrics.throughput,
      errorRate: metrics.errorRate,
      poolUtilization: metrics.poolUtilization,
    };

    // Save metrics to storage for historical analysis
    const now = new Date();
    await this.storage.saveMetric(connectionId, 'latency', currentMetrics.latency, now);
    await this.storage.saveMetric(connectionId, 'throughput', currentMetrics.throughput, now);
    await this.storage.saveMetric(connectionId, 'errorRate', currentMetrics.errorRate, now);
    await this.storage.saveMetric(
      connectionId,
      'poolUtilization',
      currentMetrics.poolUtilization,
      now
    );

    // Run anomaly detection
    const anomalies = await anomalyMonitor.analyzeConnection(connectionId, currentMetrics);

    if (anomalies.length > 0) {
      await this.handleAnomalies(connectionId, anomalies);
    }

    // Update Prometheus metrics
    const health = anomalyMonitor.getConnectionHealth(connectionId);
    metricsManager.updateMLHealthScore(connectionId, health.healthScore);
    metricsManager.incrementMLAnomaliesDetected(connectionId, anomalies.length);
  }

  /**
   * Handle detected anomalies
   */
  private async handleAnomalies(
    connectionId: string,
    anomalies: AnomalyDetection[]
  ): Promise<void> {
    log.warn('Anomalies detected', {
      connectionId,
      count: anomalies.length,
      anomalies: anomalies.map((a) => ({
        metric: a.metric,
        severity: a.severity,
        confidence: a.confidence,
        value: a.value,
        expectedRange: a.expectedRange,
      })),
    });

    // Filter critical anomalies
    const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');

    if (criticalAnomalies.length > 0) {
      await this.handleCriticalAnomalies(connectionId, criticalAnomalies);
    }

    // Update Prometheus metrics for each anomaly
    for (const anomaly of anomalies) {
      metricsManager.recordMLAnomaly(connectionId, anomaly.metric, anomaly.severity);
    }
  }

  /**
   * Handle critical anomalies (high priority)
   */
  private async handleCriticalAnomalies(
    connectionId: string,
    criticalAnomalies: AnomalyDetection[]
  ): Promise<void> {
    log.error('CRITICAL anomalies detected', {
      connectionId,
      count: criticalAnomalies.length,
      details: criticalAnomalies.map((a) => ({
        metric: a.metric,
        value: a.value,
        expectedRange: a.expectedRange,
        confidence: a.confidence,
      })),
    });

    // TODO: Emit alerts/notifications
    // - Send email
    // - Send Slack/Teams notification
    // - Trigger webhook
    // - Create incident in monitoring system

    // For now, just log critical alert
    for (const anomaly of criticalAnomalies) {
      log.error('CRITICAL ALERT', {
        connectionId,
        metric: anomaly.metric,
        message: `${anomaly.metric} is critically anomalous`,
        currentValue: anomaly.value,
        expectedRange: anomaly.expectedRange,
        severity: anomaly.severity,
        confidence: `${anomaly.confidence}%`,
        timestamp: anomaly.timestamp,
      });
    }
  }

  /**
   * Get all connection IDs to monitor
   */
  private getAllConnectionIds(): string[] {
    const connectionIds: string[] = [];

    // Add all Datasul connections
    for (const env of Object.values(AVAILABLE_CONNECTIONS.datasul)) {
      for (const config of Object.values(env)) {
        connectionIds.push(config.dsn);
      }
    }

    // Add all Informix connections
    for (const env of Object.values(AVAILABLE_CONNECTIONS.informix)) {
      connectionIds.push(env.logix.dsn);
    }

    // Add all SQL Server connections (PCFactory)
    for (const env of Object.values(AVAILABLE_CONNECTIONS.sqlserver.pcfactory)) {
      for (const config of Object.values(env)) {
        connectionIds.push(config.dsn);
      }
    }

    // Add all SQL Server connections (Corporativo)
    for (const env of Object.values(AVAILABLE_CONNECTIONS.sqlserver.corporativo)) {
      connectionIds.push(env.datacorp.dsn);
    }

    return connectionIds;
  }

  /**
   * Get worker status
   */
  getStatus(): {
    running: boolean;
    enabled: boolean;
    checkInterval: number;
    storageStats: ReturnType<AnomalyStorage['getStats']>;
  } {
    return {
      running: this.isRunning,
      enabled: this.enabled,
      checkInterval: this.checkIntervalMs,
      storageStats: this.storage.getStats(),
    };
  }
}

/**
 * Singleton instance
 */
export const anomalyWorker = new AnomalyMonitorWorker();
