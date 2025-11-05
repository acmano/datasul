// src/infrastructure/ml/AnomalyDetector.ts

/**
 * @fileoverview Core Anomaly Detection System using Statistical ML Algorithms
 *
 * Implements three detection algorithms:
 * 1. Z-Score: Statistical outlier detection based on standard deviation
 * 2. IQR (Interquartile Range): Robust outlier detection using quartiles
 * 3. Moving Average: Trend-based detection comparing against moving average
 *
 * Uses consensus voting: anomaly is confirmed when 2+ algorithms agree.
 *
 * @module infrastructure/ml/AnomalyDetector
 */

/**
 * Anomaly detection result from a single algorithm
 *
 * @interface AnomalyResult
 */
export interface AnomalyResult {
  /** Whether the value is anomalous */
  isAnomaly: boolean;
  /** Anomaly score (algorithm-specific) */
  score: number;
  /** Severity level */
  severity: AnomalySeverity;
  /** Expected value range [min, max] */
  expectedRange?: [number, number];
}

/**
 * Anomaly severity levels
 *
 * @enum {string}
 */
export enum AnomalySeverity {
  /** Low severity (minor deviation) */
  LOW = 'low',
  /** Medium severity (moderate deviation) */
  MEDIUM = 'medium',
  /** High severity (significant deviation) */
  HIGH = 'high',
  /** Critical severity (extreme deviation) */
  CRITICAL = 'critical',
}

/**
 * Consensus detection result combining multiple algorithms
 *
 * @interface ConsensusResult
 */
export interface ConsensusResult {
  /** Whether anomaly is confirmed by consensus */
  isAnomaly: boolean;
  /** Consensus score (0-1) */
  consensusScore: number;
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Final severity level */
  severity: AnomalySeverity;
  /** Algorithm scores */
  algorithmScores: {
    zscore: AnomalyResult;
    iqr: AnomalyResult;
    movingAvg: AnomalyResult;
  };
}

/**
 * Statistical utility functions
 */
class StatisticalUtils {
  /**
   * Calculate mean (average) of array
   */
  static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  static calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile from sorted array
   */
  static calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedArray[lower];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate IQR (Interquartile Range)
   */
  static calculateIQR(sortedArray: number[]): { q1: number; q3: number; iqr: number } {
    const q1 = this.calculatePercentile(sortedArray, 25);
    const q3 = this.calculatePercentile(sortedArray, 75);
    return { q1, q3, iqr: q3 - q1 };
  }
}

/**
 * Z-Score Anomaly Detector
 *
 * Detects outliers based on standard deviation.
 * Threshold: |z| > 3 = anomaly
 *
 * @class ZScoreDetector
 */
export class ZScoreDetector {
  private readonly criticalThreshold = 3.0;
  private readonly highThreshold = 2.5;
  private readonly mediumThreshold = 2.0;

  /**
   * Detect anomaly using Z-Score method
   *
   * @param value - Current value to test
   * @param historical - Historical values for baseline
   * @returns Anomaly detection result
   */
  detect(value: number, historical: number[]): AnomalyResult {
    if (historical.length < 2) {
      return {
        isAnomaly: false,
        score: 0,
        severity: AnomalySeverity.LOW,
      };
    }

    const mean = StatisticalUtils.calculateMean(historical);
    const stdDev = StatisticalUtils.calculateStdDev(historical);

    if (stdDev === 0) {
      // No variation in data - any deviation is anomalous
      return {
        isAnomaly: value !== mean,
        score: value === mean ? 0 : Infinity,
        severity: value === mean ? AnomalySeverity.LOW : AnomalySeverity.CRITICAL,
        expectedRange: [mean, mean],
      };
    }

    const zScore = (value - mean) / stdDev;
    const absZScore = Math.abs(zScore);

    return {
      isAnomaly: absZScore > this.criticalThreshold,
      score: zScore,
      severity: this.getSeverity(absZScore),
      expectedRange: [mean - 3 * stdDev, mean + 3 * stdDev],
    };
  }

  /**
   * Determine severity based on Z-Score magnitude
   */
  private getSeverity(absZScore: number): AnomalySeverity {
    if (absZScore >= this.criticalThreshold) return AnomalySeverity.CRITICAL;
    if (absZScore >= this.highThreshold) return AnomalySeverity.HIGH;
    if (absZScore >= this.mediumThreshold) return AnomalySeverity.MEDIUM;
    return AnomalySeverity.LOW;
  }
}

/**
 * IQR (Interquartile Range) Anomaly Detector
 *
 * Detects outliers using quartiles (robust to extreme values).
 * Outlier if: value < Q1 - 1.5*IQR or value > Q3 + 1.5*IQR
 *
 * @class IQRDetector
 */
export class IQRDetector {
  private readonly iqrMultiplier = 1.5;

  /**
   * Detect anomaly using IQR method
   *
   * @param value - Current value to test
   * @param historical - Historical values for baseline
   * @returns Anomaly detection result
   */
  detect(value: number, historical: number[]): AnomalyResult {
    if (historical.length < 4) {
      return {
        isAnomaly: false,
        score: 0,
        severity: AnomalySeverity.LOW,
      };
    }

    const sorted = [...historical].sort((a, b) => a - b);
    const { q1, q3, iqr } = StatisticalUtils.calculateIQR(sorted);

    const lowerBound = q1 - this.iqrMultiplier * iqr;
    const upperBound = q3 + this.iqrMultiplier * iqr;

    const isAnomaly = value < lowerBound || value > upperBound;
    const score = this.calculateScore(value, lowerBound, upperBound, iqr);
    const severity = this.getSeverity(value, lowerBound, upperBound, iqr);

    return {
      isAnomaly,
      score,
      severity,
      expectedRange: [lowerBound, upperBound],
    };
  }

  /**
   * Calculate anomaly score based on distance from bounds
   */
  private calculateScore(
    value: number,
    lowerBound: number,
    upperBound: number,
    iqr: number
  ): number {
    if (value >= lowerBound && value <= upperBound) {
      return 0; // Within normal range
    }

    if (value < lowerBound) {
      return (lowerBound - value) / (iqr || 1);
    }

    return (value - upperBound) / (iqr || 1);
  }

  /**
   * Determine severity based on distance from bounds
   */
  private getSeverity(
    value: number,
    lowerBound: number,
    upperBound: number,
    iqr: number
  ): AnomalySeverity {
    if (value >= lowerBound && value <= upperBound) {
      return AnomalySeverity.LOW;
    }

    const score = this.calculateScore(value, lowerBound, upperBound, iqr);

    if (score >= 3.0) return AnomalySeverity.CRITICAL;
    if (score >= 2.0) return AnomalySeverity.HIGH;
    if (score >= 1.0) return AnomalySeverity.MEDIUM;
    return AnomalySeverity.LOW;
  }
}

/**
 * Moving Average Anomaly Detector
 *
 * Detects sudden changes by comparing against moving average.
 * Anomaly if: |value - movingAvg| > threshold * stdDev
 *
 * @class MovingAverageDetector
 */
export class MovingAverageDetector {
  private readonly windowSize = 100; // Last 100 samples
  private readonly thresholdMultiplier = 2.5;

  /**
   * Detect anomaly using Moving Average method
   *
   * @param value - Current value to test
   * @param historical - Historical values for baseline
   * @returns Anomaly detection result
   */
  detect(value: number, historical: number[]): AnomalyResult {
    if (historical.length < 10) {
      return {
        isAnomaly: false,
        score: 0,
        severity: AnomalySeverity.LOW,
      };
    }

    // Use only recent window
    const window = historical.slice(-this.windowSize);
    const movingAvg = StatisticalUtils.calculateMean(window);
    const stdDev = StatisticalUtils.calculateStdDev(window);

    if (stdDev === 0) {
      return {
        isAnomaly: value !== movingAvg,
        score: value === movingAvg ? 0 : Infinity,
        severity: value === movingAvg ? AnomalySeverity.LOW : AnomalySeverity.CRITICAL,
        expectedRange: [movingAvg, movingAvg],
      };
    }

    const deviation = Math.abs(value - movingAvg);
    const threshold = this.thresholdMultiplier * stdDev;
    const score = deviation / stdDev;

    return {
      isAnomaly: deviation > threshold,
      score,
      severity: this.getSeverity(score),
      expectedRange: [movingAvg - threshold, movingAvg + threshold],
    };
  }

  /**
   * Determine severity based on deviation magnitude
   */
  private getSeverity(score: number): AnomalySeverity {
    if (score >= 4.0) return AnomalySeverity.CRITICAL;
    if (score >= 3.0) return AnomalySeverity.HIGH;
    if (score >= 2.5) return AnomalySeverity.MEDIUM;
    return AnomalySeverity.LOW;
  }
}

/**
 * Consensus Anomaly Detector
 *
 * Combines multiple detection algorithms using voting.
 * Anomaly confirmed when 2+ algorithms agree.
 *
 * @class ConsensusDetector
 */
export class ConsensusDetector {
  private readonly zscoreDetector: ZScoreDetector;
  private readonly iqrDetector: IQRDetector;
  private readonly movingAvgDetector: MovingAverageDetector;

  constructor() {
    this.zscoreDetector = new ZScoreDetector();
    this.iqrDetector = new IQRDetector();
    this.movingAvgDetector = new MovingAverageDetector();
  }

  /**
   * Detect anomaly using consensus voting
   *
   * @param value - Current value to test
   * @param historical - Historical values for baseline
   * @returns Consensus detection result
   */
  detect(value: number, historical: number[]): ConsensusResult {
    // Run all three algorithms
    const zscoreResult = this.zscoreDetector.detect(value, historical);
    const iqrResult = this.iqrDetector.detect(value, historical);
    const movingAvgResult = this.movingAvgDetector.detect(value, historical);

    // Count how many algorithms detected anomaly
    const detections = [zscoreResult, iqrResult, movingAvgResult];
    const anomalyCount = detections.filter((r) => r.isAnomaly).length;

    // Consensus: 2+ algorithms must agree
    const isAnomaly = anomalyCount >= 2;

    // Calculate confidence (percentage of agreement)
    const confidence = (anomalyCount / 3) * 100;

    // Calculate consensus score (average of detected scores)
    const consensusScore =
      detections.reduce((sum, r) => sum + Math.abs(r.score), 0) / detections.length;

    // Determine final severity (highest severity among detections)
    const severity = this.calculateConsensusSeverity(detections);

    return {
      isAnomaly,
      consensusScore,
      confidence,
      severity,
      algorithmScores: {
        zscore: zscoreResult,
        iqr: iqrResult,
        movingAvg: movingAvgResult,
      },
    };
  }

  /**
   * Calculate consensus severity (highest among all detections)
   */
  private calculateConsensusSeverity(results: AnomalyResult[]): AnomalySeverity {
    const severityOrder = [
      AnomalySeverity.CRITICAL,
      AnomalySeverity.HIGH,
      AnomalySeverity.MEDIUM,
      AnomalySeverity.LOW,
    ];

    for (const severity of severityOrder) {
      if (results.some((r) => r.severity === severity && r.isAnomaly)) {
        return severity;
      }
    }

    return AnomalySeverity.LOW;
  }
}
