// src/infrastructure/ml/AnomalyStorage.ts

/**
 * @fileoverview Anomaly Storage System
 *
 * Stores historical metrics and detected anomalies for machine learning analysis.
 * Supports both in-memory (fast) and Redis (persistent) storage.
 *
 * Features:
 * - Historical metric storage (7 days retention)
 * - Anomaly detection history
 * - Rolling window support
 * - Automatic cleanup of old data
 *
 * @module infrastructure/ml/AnomalyStorage
 */

import { AnomalyDetection } from './ConnectionAnomalyMonitor';
import { log } from '@shared/utils/logger';

/**
 * Historical metric data for a connection
 *
 * @interface MetricHistory
 */
export interface MetricHistory {
  /** Connection identifier */
  connectionId: string;
  /** Metric name */
  metric: string;
  /** Historical values */
  values: number[];
  /** Timestamps for each value */
  timestamps: number[];
}

/**
 * Metric data point (value + timestamp)
 *
 * @interface MetricDataPoint
 */
interface MetricDataPoint {
  value: number;
  timestamp: number;
}

/**
 * Anomaly Storage
 *
 * @description
 * Manages storage of historical metrics and detected anomalies.
 * Uses in-memory storage by default with optional Redis backend.
 *
 * Data retention:
 * - Historical metrics: 7 days
 * - Anomalies: 30 days
 *
 * @example
 * ```typescript
 * const storage = new AnomalyStorage();
 *
 * // Save metric
 * await storage.saveMetric('DtsPrdEmp', 'latency', 150, new Date());
 *
 * // Get historical data
 * const historical = await storage.getHistorical('DtsPrdEmp', 'latency', 24 * 60 * 60 * 1000);
 *
 * // Save anomaly
 * await storage.saveAnomaly(anomalyDetection);
 * ```
 *
 * @class AnomalyStorage
 */
export class AnomalyStorage {
  /**
   * In-memory storage for metrics
   * Map<connectionId:metric, MetricDataPoint[]>
   */
  private metricsStore: Map<string, MetricDataPoint[]>;

  /**
   * In-memory storage for anomalies
   * Map<connectionId, AnomalyDetection[]>
   */
  private anomaliesStore: Map<string, AnomalyDetection[]>;

  /**
   * Historical data retention (7 days in milliseconds)
   */
  private readonly metricsRetention = 7 * 24 * 60 * 60 * 1000;

  /**
   * Anomalies retention (30 days in milliseconds)
   */
  private readonly anomaliesRetention = 30 * 24 * 60 * 60 * 1000;

  /**
   * Cleanup interval handle
   */
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metricsStore = new Map();
    this.anomaliesStore = new Map();

    // Start cleanup interval (every hour)
    this.startCleanupInterval();

    log.info('AnomalyStorage initialized (in-memory mode)');
  }

  /**
   * Save a metric data point
   *
   * @param connectionId - Connection identifier
   * @param metric - Metric name
   * @param value - Metric value
   * @param timestamp - Timestamp when metric was recorded
   *
   * @example
   * ```typescript
   * await storage.saveMetric('DtsPrdEmp', 'latency', 150, new Date());
   * await storage.saveMetric('LgxDev', 'throughput', 45.5, new Date());
   * ```
   */
  async saveMetric(
    connectionId: string,
    metric: string,
    value: number,
    timestamp: Date
  ): Promise<void> {
    const key = this.getMetricKey(connectionId, metric);

    let dataPoints = this.metricsStore.get(key);
    if (!dataPoints) {
      dataPoints = [];
      this.metricsStore.set(key, dataPoints);
    }

    dataPoints.push({
      value,
      timestamp: timestamp.getTime(),
    });

    // Cleanup old data immediately if too many points
    if (dataPoints.length > 10000) {
      this.cleanupMetrics(key);
    }
  }

  /**
   * Get historical metric values
   *
   * @param connectionId - Connection identifier
   * @param metric - Metric name
   * @param duration - Duration to retrieve (in milliseconds)
   * @returns Array of historical values
   *
   * @example
   * ```typescript
   * // Get last 24 hours of latency data
   * const latency = await storage.getHistorical('DtsPrdEmp', 'latency', 24 * 60 * 60 * 1000);
   * console.log(`Got ${latency.length} data points`);
   * ```
   */
  async getHistorical(connectionId: string, metric: string, duration: number): Promise<number[]> {
    const key = this.getMetricKey(connectionId, metric);
    const dataPoints = this.metricsStore.get(key) || [];

    const cutoff = Date.now() - duration;

    // Filter and return only values within duration
    return dataPoints.filter((dp) => dp.timestamp > cutoff).map((dp) => dp.value);
  }

  /**
   * Save detected anomaly
   *
   * @param anomaly - Anomaly detection result
   *
   * @example
   * ```typescript
   * await storage.saveAnomaly({
   *   connectionId: 'DtsPrdEmp',
   *   metric: 'latency',
   *   value: 500,
   *   severity: 'high',
   *   // ... other fields
   * });
   * ```
   */
  async saveAnomaly(anomaly: AnomalyDetection): Promise<void> {
    let anomalies = this.anomaliesStore.get(anomaly.connectionId);
    if (!anomalies) {
      anomalies = [];
      this.anomaliesStore.set(anomaly.connectionId, anomalies);
    }

    anomalies.push(anomaly);

    log.debug('Anomaly saved', {
      connectionId: anomaly.connectionId,
      metric: anomaly.metric,
      severity: anomaly.severity,
    });
  }

  /**
   * Get anomalies for a connection within time range
   *
   * @param connectionId - Connection identifier
   * @param from - Start timestamp
   * @param to - End timestamp
   * @returns Array of anomalies
   *
   * @example
   * ```typescript
   * const from = new Date('2025-10-24T00:00:00Z');
   * const to = new Date('2025-10-25T00:00:00Z');
   * const anomalies = await storage.getAnomalies('DtsPrdEmp', from, to);
   * ```
   */
  async getAnomalies(connectionId: string, from: Date, to: Date): Promise<AnomalyDetection[]> {
    const anomalies = this.anomaliesStore.get(connectionId) || [];

    return anomalies.filter((a) => {
      const timestamp = a.timestamp.getTime();
      return timestamp >= from.getTime() && timestamp <= to.getTime();
    });
  }

  /**
   * Get recent anomalies (last N milliseconds)
   *
   * @param connectionId - Connection identifier
   * @param duration - Duration in milliseconds
   * @returns Array of recent anomalies
   *
   * @example
   * ```typescript
   * // Get anomalies from last hour
   * const recent = storage.getRecentAnomalies('DtsPrdEmp', 60 * 60 * 1000);
   * ```
   */
  getRecentAnomalies(connectionId: string, duration: number): AnomalyDetection[] {
    const anomalies = this.anomaliesStore.get(connectionId) || [];
    const cutoff = Date.now() - duration;

    return anomalies.filter((a) => a.timestamp.getTime() > cutoff);
  }

  /**
   * Get all connection IDs that have stored data
   *
   * @returns Array of connection IDs
   */
  getAllConnectionIds(): string[] {
    const connectionIds = new Set<string>();

    // From metrics
    for (const key of this.metricsStore.keys()) {
      const [connectionId] = key.split(':');
      if (connectionId) {
        connectionIds.add(connectionId);
      }
    }

    // From anomalies
    for (const connectionId of this.anomaliesStore.keys()) {
      connectionIds.add(connectionId);
    }

    return Array.from(connectionIds);
  }

  /**
   * Clear all history for a connection
   *
   * @param connectionId - Connection identifier
   *
   * @example
   * ```typescript
   * await storage.clearHistory('DtsPrdEmp');
   * ```
   */
  async clearHistory(connectionId: string): Promise<void> {
    // Clear metrics
    const keysToDelete: string[] = [];
    for (const key of this.metricsStore.keys()) {
      if (key.startsWith(`${connectionId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.metricsStore.delete(key);
    }

    // Clear anomalies
    this.anomaliesStore.delete(connectionId);

    log.info('History cleared', { connectionId });
  }

  /**
   * Get storage statistics
   *
   * @returns Storage statistics
   */
  getStats(): {
    totalConnections: number;
    totalMetrics: number;
    totalAnomalies: number;
    memoryUsage: string;
  } {
    let totalMetrics = 0;
    for (const dataPoints of this.metricsStore.values()) {
      totalMetrics += dataPoints.length;
    }

    let totalAnomalies = 0;
    for (const anomalies of this.anomaliesStore.values()) {
      totalAnomalies += anomalies.length;
    }

    const totalConnections = this.getAllConnectionIds().length;

    // Rough memory estimation
    const bytesPerMetric = 16; // 8 bytes (number) + 8 bytes (timestamp)
    const bytesPerAnomaly = 200; // Rough estimate
    const memoryBytes = totalMetrics * bytesPerMetric + totalAnomalies * bytesPerAnomaly;
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

    return {
      totalConnections,
      totalMetrics,
      totalAnomalies,
      memoryUsage: `${memoryMB} MB`,
    };
  }

  /**
   * Stop storage and cleanup
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    log.info('AnomalyStorage stopped');
  }

  /**
   * Generate metric storage key
   */
  private getMetricKey(connectionId: string, metric: string): string {
    return `${connectionId}:${metric}`;
  }

  /**
   * Start periodic cleanup of old data
   */
  private startCleanupInterval(): void {
    // Cleanup every hour
    this.cleanupInterval = setInterval(
      () => {
        this.performCleanup();
      },
      60 * 60 * 1000
    );
  }

  /**
   * Perform cleanup of old data
   */
  private performCleanup(): void {
    const now = Date.now();

    // Cleanup metrics
    let metricsRemoved = 0;
    for (const key of this.metricsStore.keys()) {
      const removed = this.cleanupMetrics(key);
      metricsRemoved += removed;
    }

    // Cleanup anomalies
    let anomaliesRemoved = 0;
    const anomalyCutoff = now - this.anomaliesRetention;

    for (const [connectionId, anomalies] of this.anomaliesStore.entries()) {
      const originalLength = anomalies.length;
      const filtered = anomalies.filter((a) => a.timestamp.getTime() > anomalyCutoff);
      this.anomaliesStore.set(connectionId, filtered);
      anomaliesRemoved += originalLength - filtered.length;
    }

    if (metricsRemoved > 0 || anomaliesRemoved > 0) {
      log.debug('Storage cleanup completed', {
        metricsRemoved,
        anomaliesRemoved,
      });
    }
  }

  /**
   * Cleanup old metrics for a specific key
   *
   * @returns Number of data points removed
   */
  private cleanupMetrics(key: string): number {
    const dataPoints = this.metricsStore.get(key);
    if (!dataPoints) return 0;

    const cutoff = Date.now() - this.metricsRetention;
    const originalLength = dataPoints.length;

    const filtered = dataPoints.filter((dp) => dp.timestamp > cutoff);
    this.metricsStore.set(key, filtered);

    return originalLength - filtered.length;
  }
}
