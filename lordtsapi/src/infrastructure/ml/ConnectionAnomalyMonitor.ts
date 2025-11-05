// src/infrastructure/ml/ConnectionAnomalyMonitor.ts

/**
 * @fileoverview Connection Anomaly Monitoring System
 *
 * Monitors database connection metrics and detects anomalous behavior using ML algorithms.
 * Tracks latency, throughput, error rate, and pool utilization for all 28 connections.
 *
 * Features:
 * - Multi-algorithm anomaly detection (Z-Score, IQR, Moving Average)
 * - Consensus voting for reliable detection
 * - Health scoring (0-100)
 * - Baseline learning from historical data
 * - Real-time monitoring
 *
 * @module infrastructure/ml/ConnectionAnomalyMonitor
 */

import { ConsensusDetector, AnomalySeverity, ConsensusResult } from './AnomalyDetector';
import { AnomalyStorage, MetricHistory } from './AnomalyStorage';
import { log } from '@shared/utils/logger';

/**
 * Metrics analyzed for anomaly detection
 *
 * @interface AnomalyMetrics
 */
export interface AnomalyMetrics {
  /** Latency in milliseconds (P95) */
  latency: number;
  /** Throughput (queries per second) */
  throughput: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Pool utilization percentage (0-100) */
  poolUtilization: number;
}

/**
 * Anomaly detection result for a specific connection and metric
 *
 * @interface AnomalyDetection
 */
export interface AnomalyDetection {
  /** Connection identifier (DSN) */
  connectionId: string;
  /** Timestamp when anomaly was detected */
  timestamp: Date;
  /** Metric that is anomalous */
  metric: keyof AnomalyMetrics;
  /** Current value of the metric */
  value: number;
  /** Expected normal range [min, max] */
  expectedRange: [number, number];
  /** Severity level */
  severity: AnomalySeverity;
  /** Anomaly score */
  score: number;
  /** Primary algorithm that detected (best match) */
  algorithm: 'zscore' | 'iqr' | 'movingavg';
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Detailed algorithm scores */
  details: ConsensusResult;
}

/**
 * Connection health score and status
 *
 * @interface ConnectionHealth
 */
export interface ConnectionHealth {
  /** Connection identifier */
  connectionId: string;
  /** Overall health score (0-100, 100 = perfect) */
  healthScore: number;
  /** Health status */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  /** Number of active anomalies */
  activeAnomalies: number;
  /** Anomaly details */
  anomalies: AnomalyDetection[];
  /** Timestamp */
  timestamp: Date;
}

/**
 * Connection Anomaly Monitor
 *
 * @description
 * Main class for monitoring connection health and detecting anomalous behavior.
 * Uses multiple ML algorithms with consensus voting for reliable detection.
 *
 * @example
 * ```typescript
 * const monitor = new ConnectionAnomalyMonitor();
 *
 * // Analyze connection metrics
 * const anomalies = await monitor.analyzeConnection('DtsPrdEmp', {
 *   latency: 250,
 *   throughput: 45,
 *   errorRate: 0.05,
 *   poolUtilization: 85
 * });
 *
 * // Get health score
 * const health = monitor.getConnectionHealth('DtsPrdEmp');
 * console.log(`Health score: ${health.healthScore}`);
 * ```
 *
 * @class ConnectionAnomalyMonitor
 */
export class ConnectionAnomalyMonitor {
  private readonly detector: ConsensusDetector;
  private readonly storage: AnomalyStorage;
  private readonly confidenceThreshold: number;

  /**
   * Minimum number of samples required for anomaly detection
   */
  private readonly minSamplesRequired = 30;

  /**
   * Baseline learning duration (24 hours in milliseconds)
   */
  private readonly baselineDuration =
    parseInt(process.env.ML_ANOMALY_BASELINE_DURATION || '86400000', 10) || 24 * 60 * 60 * 1000;

  constructor() {
    this.detector = new ConsensusDetector();
    this.storage = new AnomalyStorage();
    this.confidenceThreshold = parseInt(process.env.ML_ANOMALY_CONFIDENCE_THRESHOLD || '66', 10);
  }

  /**
   * Analyze connection metrics and detect anomalies
   *
   * @param connectionId - Connection identifier (DSN)
   * @param currentMetrics - Current metrics snapshot
   * @returns Array of detected anomalies
   *
   * @example
   * ```typescript
   * const anomalies = await monitor.analyzeConnection('DtsPrdEmp', {
   *   latency: 350,  // High latency
   *   throughput: 10,  // Low throughput
   *   errorRate: 0.02,
   *   poolUtilization: 90
   * });
   *
   * if (anomalies.length > 0) {
   *   console.log(`Detected ${anomalies.length} anomalies`);
   * }
   * ```
   */
  async analyzeConnection(
    connectionId: string,
    currentMetrics: AnomalyMetrics
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Check each metric
    for (const [metricName, value] of Object.entries(currentMetrics)) {
      const metric = metricName as keyof AnomalyMetrics;

      // Get historical data
      const historical = await this.storage.getHistorical(
        connectionId,
        metric,
        this.baselineDuration
      );

      // Skip if insufficient data
      if (historical.length < this.minSamplesRequired) {
        log.debug(`Insufficient data for ${connectionId}.${metric}: ${historical.length} samples`, {
          connectionId,
          metric,
          samples: historical.length,
        });
        continue;
      }

      // Run consensus detection
      const detection = this.detector.detect(value, historical);

      // Only report if confidence meets threshold
      if (detection.isAnomaly && detection.confidence >= this.confidenceThreshold) {
        const expectedRange = this.calculateExpectedRange(historical, detection);

        const anomaly: AnomalyDetection = {
          connectionId,
          timestamp: new Date(),
          metric,
          value,
          expectedRange,
          severity: detection.severity,
          score: detection.consensusScore,
          algorithm: this.getBestAlgorithm(detection),
          confidence: detection.confidence,
          details: detection,
        };

        anomalies.push(anomaly);

        // Save anomaly to storage
        await this.storage.saveAnomaly(anomaly);

        log.warn('Anomaly detected', {
          connectionId,
          metric,
          value,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          expectedRange: anomaly.expectedRange,
        });
      }
    }

    return anomalies;
  }

  /**
   * Learn baseline behavior for a connection
   *
   * @param connectionId - Connection identifier
   * @param duration - Duration to learn from (default: 24h)
   *
   * @example
   * ```typescript
   * // Learn baseline from last 24 hours
   * await monitor.learnBaseline('DtsPrdEmp');
   *
   * // Learn from specific duration
   * await monitor.learnBaseline('DtsPrdEmp', 7 * 24 * 60 * 60 * 1000); // 7 days
   * ```
   */
  async learnBaseline(connectionId: string, duration?: number): Promise<void> {
    const learningDuration = duration || this.baselineDuration;
    const metrics: Array<keyof AnomalyMetrics> = [
      'latency',
      'throughput',
      'errorRate',
      'poolUtilization',
    ];

    log.info('Learning baseline', {
      connectionId,
      duration: learningDuration,
    });

    for (const metric of metrics) {
      const historical = await this.storage.getHistorical(connectionId, metric, learningDuration);

      if (historical.length > 0) {
        log.debug('Baseline learned', {
          connectionId,
          metric,
          samples: historical.length,
          mean: this.calculateMean(historical),
          min: Math.min(...historical),
          max: Math.max(...historical),
        });
      } else {
        log.warn('No data for baseline learning', {
          connectionId,
          metric,
        });
      }
    }
  }

  /**
   * Get connection health score and status
   *
   * @param connectionId - Connection identifier
   * @returns Connection health information
   *
   * @example
   * ```typescript
   * const health = monitor.getConnectionHealth('DtsPrdEmp');
   *
   * if (health.status === 'critical') {
   *   console.error(`Connection ${health.connectionId} is critical!`);
   * }
   * ```
   */
  getConnectionHealth(connectionId: string): ConnectionHealth {
    const recentAnomalies = this.storage.getRecentAnomalies(connectionId, 60 * 60 * 1000); // Last hour

    // Calculate health score (100 = perfect, 0 = terrible)
    const healthScore = this.calculateHealthScore(recentAnomalies);

    // Determine status based on health score
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
    if (healthScore >= 80) {
      status = 'healthy';
    } else if (healthScore >= 60) {
      status = 'degraded';
    } else if (healthScore >= 40) {
      status = 'unhealthy';
    } else {
      status = 'critical';
    }

    return {
      connectionId,
      healthScore,
      status,
      activeAnomalies: recentAnomalies.length,
      anomalies: recentAnomalies,
      timestamp: new Date(),
    };
  }

  /**
   * Get all connections health status
   *
   * @returns Map of connection ID to health information
   */
  getAllConnectionsHealth(): Map<string, ConnectionHealth> {
    const allConnectionIds = this.storage.getAllConnectionIds();
    const healthMap = new Map<string, ConnectionHealth>();

    for (const connectionId of allConnectionIds) {
      healthMap.set(connectionId, this.getConnectionHealth(connectionId));
    }

    return healthMap;
  }

  /**
   * Clear baseline data for a connection (force relearning)
   *
   * @param connectionId - Connection identifier
   */
  async clearBaseline(connectionId: string): Promise<void> {
    await this.storage.clearHistory(connectionId);
    log.info('Baseline cleared', { connectionId });
  }

  /**
   * Calculate expected range from historical data and detection
   */
  private calculateExpectedRange(
    historical: number[],
    detection: ConsensusResult
  ): [number, number] {
    // Use the most conservative range from all algorithms
    const ranges: Array<[number, number]> = [];

    if (detection.algorithmScores.zscore.expectedRange) {
      ranges.push(detection.algorithmScores.zscore.expectedRange);
    }
    if (detection.algorithmScores.iqr.expectedRange) {
      ranges.push(detection.algorithmScores.iqr.expectedRange);
    }
    if (detection.algorithmScores.movingAvg.expectedRange) {
      ranges.push(detection.algorithmScores.movingAvg.expectedRange);
    }

    if (ranges.length === 0) {
      const min = Math.min(...historical);
      const max = Math.max(...historical);
      return [min, max];
    }

    // Use widest range (most conservative)
    const minBound = Math.min(...ranges.map((r) => r[0]));
    const maxBound = Math.max(...ranges.map((r) => r[1]));

    return [minBound, maxBound];
  }

  /**
   * Determine which algorithm performed best (highest score on anomaly)
   */
  private getBestAlgorithm(detection: ConsensusResult): 'zscore' | 'iqr' | 'movingavg' {
    const scores = [
      { name: 'zscore' as const, score: Math.abs(detection.algorithmScores.zscore.score) },
      { name: 'iqr' as const, score: Math.abs(detection.algorithmScores.iqr.score) },
      { name: 'movingavg' as const, score: Math.abs(detection.algorithmScores.movingAvg.score) },
    ];

    scores.sort((a, b) => b.score - a.score);
    return scores[0].name;
  }

  /**
   * Calculate health score based on recent anomalies
   *
   * Health score calculation:
   * - Start with 100
   * - Subtract points based on severity and frequency
   * - Critical anomaly: -20 points
   * - High anomaly: -10 points
   * - Medium anomaly: -5 points
   * - Low anomaly: -2 points
   */
  private calculateHealthScore(anomalies: AnomalyDetection[]): number {
    let score = 100;

    for (const anomaly of anomalies) {
      switch (anomaly.severity) {
        case AnomalySeverity.CRITICAL:
          score -= 20;
          break;
        case AnomalySeverity.HIGH:
          score -= 10;
          break;
        case AnomalySeverity.MEDIUM:
          score -= 5;
          break;
        case AnomalySeverity.LOW:
          score -= 2;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate mean of array
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

/**
 * Singleton instance
 */
export const anomalyMonitor = new ConnectionAnomalyMonitor();
