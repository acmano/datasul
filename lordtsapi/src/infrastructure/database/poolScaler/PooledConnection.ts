// src/infrastructure/database/poolScaler/PooledConnection.ts

/**
 * @fileoverview Pooled Connection Adapter
 *
 * Wraps existing connections (ODBC/SQL Server) to provide pooling capabilities.
 * Implements IConnection interface with pool management.
 *
 * @module infrastructure/database/poolScaler/PooledConnection
 */

import { log } from '@shared/utils/logger';
import { IConnection, QueryParameter } from '../types';
import { PoolMetrics } from './types';

/**
 * Connection pool entry
 *
 * @interface PoolEntry
 * @private
 */
interface PoolEntry {
  /** Connection instance */
  connection: IConnection;
  /** Is currently in use */
  inUse: boolean;
  /** Last used timestamp */
  lastUsed: number;
  /** Created timestamp */
  created: number;
}

/**
 * Waiting client in queue
 *
 * @interface WaitingClient
 * @private
 */
interface WaitingClient {
  /** Resolve promise with connection */
  resolve: (connection: IConnection) => void;
  /** Reject promise with error */
  reject: (error: Error) => void;
  /** Enqueued timestamp */
  timestamp: number;
}

/**
 * Pooled Connection Adapter
 *
 * @description
 * Provides connection pooling for any IConnection implementation.
 * Manages pool size, idle connections, and waiting queue.
 *
 * Features:
 * - Dynamic pool sizing (min/max)
 * - Connection reuse and lifecycle management
 * - Queue for waiting clients
 * - Metrics tracking (utilization, wait times)
 * - Idle connection cleanup
 *
 * @class
 */
export class PooledConnection implements IConnection {
  /** Connection factory function */
  private connectionFactory: () => Promise<IConnection>;

  /** Connection ID (DSN) */
  private connectionId: string;

  /** Pool of connections */
  private pool: PoolEntry[] = [];

  /** Waiting clients queue */
  private waitingQueue: WaitingClient[] = [];

  /** Current pool size */
  private currentSize: number = 0;

  /** Minimum pool size */
  private minPoolSize: number;

  /** Maximum pool size */
  private maxPoolSize: number;

  /** Idle timeout in ms */
  private idleTimeout: number;

  /** Wait times history (last 100) */
  private waitTimes: number[] = [];

  /** Cleanup interval handle */
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new PooledConnection
   *
   * @param {() => Promise<IConnection>} connectionFactory - Factory to create new connections
   * @param {string} connectionId - Connection identifier (DSN)
   * @param {object} options - Pool options
   * @param {number} options.minPoolSize - Minimum pool size
   * @param {number} options.maxPoolSize - Maximum pool size
   * @param {number} options.idleTimeout - Idle timeout in ms
   *
   * @example
   * ```typescript
   * const pooled = new PooledConnection(
   *   async () => {
   *     const conn = new OdbcConnection('DtsPrdEmp');
   *     await conn.connect();
   *     return conn;
   *   },
   *   'DtsPrdEmp',
   *   { minPoolSize: 2, maxPoolSize: 20, idleTimeout: 30000 }
   * );
   * await pooled.connect();
   * ```
   */
  constructor(
    connectionFactory: () => Promise<IConnection>,
    connectionId: string,
    options: {
      minPoolSize: number;
      maxPoolSize: number;
      idleTimeout: number;
    }
  ) {
    this.connectionFactory = connectionFactory;
    this.connectionId = connectionId;
    this.minPoolSize = options.minPoolSize;
    this.maxPoolSize = options.maxPoolSize;
    this.idleTimeout = options.idleTimeout;

    log.info('PooledConnection created', {
      connectionId,
      minPoolSize: this.minPoolSize,
      maxPoolSize: this.maxPoolSize,
    });
  }

  /**
   * Initialize pool (create minimum connections)
   *
   * @returns {Promise<void>}
   */
  async connect(): Promise<void> {
    // Create minimum pool size connections
    const createPromises: Promise<void>[] = [];
    for (let i = 0; i < this.minPoolSize; i++) {
      createPromises.push(this.createConnection());
    }

    await Promise.all(createPromises);

    // Start idle cleanup interval
    this.startCleanupInterval();

    log.info('PooledConnection initialized', {
      connectionId: this.connectionId,
      poolSize: this.currentSize,
    });
  }

  /**
   * Execute query (acquires connection from pool)
   *
   * @param {string} sql - SQL query
   * @returns {Promise<T[]>} Query results
   */
  async query<T = unknown>(sql: string): Promise<T[]> {
    const connection = await this.acquireConnection();

    try {
      return await connection.query<T>(sql);
    } finally {
      this.releaseConnection(connection);
    }
  }

  /**
   * Execute parameterized query
   *
   * @param {string} sql - SQL query with placeholders
   * @param {QueryParameter[]} params - Query parameters
   * @returns {Promise<T[]>} Query results
   */
  async queryWithParams<T = unknown>(sql: string, params: QueryParameter[]): Promise<T[]> {
    const connection = await this.acquireConnection();

    try {
      return await connection.queryWithParams<T>(sql, params);
    } finally {
      this.releaseConnection(connection);
    }
  }

  /**
   * Close all connections in pool
   *
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Reject all waiting clients
    for (const client of this.waitingQueue) {
      client.reject(new Error('Pool is closing'));
    }
    this.waitingQueue = [];

    // Close all connections
    const closePromises: Promise<void>[] = [];
    for (const entry of this.pool) {
      closePromises.push(entry.connection.close());
    }

    await Promise.all(closePromises);

    this.pool = [];
    this.currentSize = 0;

    log.info('PooledConnection closed', { connectionId: this.connectionId });
  }

  /**
   * Check if pool is connected
   *
   * @returns {boolean} True if pool has connections
   */
  isConnected(): boolean {
    return this.currentSize > 0;
  }

  // ============================================================================
  // POOL SCALER INTERFACE (custom methods)
  // ============================================================================

  /**
   * Get pool metrics
   *
   * @returns {PoolMetrics} Current pool metrics
   */
  getPoolMetrics(): PoolMetrics {
    const activeConnections = this.pool.filter((e) => e.inUse).length;
    const idleConnections = this.pool.filter((e) => !e.inUse).length;
    const queueLength = this.waitingQueue.length;
    const avgWaitTime =
      this.waitTimes.length > 0
        ? this.waitTimes.reduce((sum, t) => sum + t, 0) / this.waitTimes.length
        : 0;
    const utilization = this.currentSize > 0 ? activeConnections / this.currentSize : 0;
    const idleRatio = this.currentSize > 0 ? idleConnections / this.currentSize : 0;

    return {
      currentSize: this.currentSize,
      activeConnections,
      idleConnections,
      queueLength,
      avgWaitTime,
      utilization,
      idleRatio,
      timestamp: Date.now(),
    };
  }

  /**
   * Resize pool (creates/removes connections)
   *
   * @param {number} newSize - New pool size
   * @returns {Promise<void>}
   */
  async resizePool(newSize: number): Promise<void> {
    if (newSize < this.minPoolSize || newSize > this.maxPoolSize) {
      throw new Error(
        `New pool size ${newSize} outside bounds [${this.minPoolSize}, ${this.maxPoolSize}]`
      );
    }

    const currentSize = this.currentSize;

    if (newSize > currentSize) {
      // Scale up: create new connections
      const toCreate = newSize - currentSize;
      const createPromises: Promise<void>[] = [];

      for (let i = 0; i < toCreate; i++) {
        createPromises.push(this.createConnection());
      }

      await Promise.all(createPromises);

      log.info('Pool scaled up', {
        connectionId: this.connectionId,
        oldSize: currentSize,
        newSize: this.currentSize,
      });
    } else if (newSize < currentSize) {
      // Scale down: remove idle connections
      const toRemove = currentSize - newSize;
      let removed = 0;

      // Remove idle connections
      for (let i = this.pool.length - 1; i >= 0 && removed < toRemove; i--) {
        const entry = this.pool[i];

        if (!entry.inUse) {
          await entry.connection.close();
          this.pool.splice(i, 1);
          this.currentSize--;
          removed++;
        }
      }

      log.info('Pool scaled down', {
        connectionId: this.connectionId,
        oldSize: currentSize,
        newSize: this.currentSize,
        removed,
      });
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Pool Management
  // ============================================================================

  /**
   * Create new connection and add to pool
   * @private
   */
  private async createConnection(): Promise<void> {
    if (this.currentSize >= this.maxPoolSize) {
      throw new Error(`Pool size limit reached: ${this.maxPoolSize}`);
    }

    const connection = await this.connectionFactory();
    const now = Date.now();

    this.pool.push({
      connection,
      inUse: false,
      lastUsed: now,
      created: now,
    });

    this.currentSize++;
  }

  /**
   * Acquire connection from pool (or wait in queue)
   * @private
   */
  private async acquireConnection(): Promise<IConnection> {
    const startWait = Date.now();

    // Find idle connection
    const idleEntry = this.pool.find((e) => !e.inUse);

    if (idleEntry) {
      idleEntry.inUse = true;
      idleEntry.lastUsed = Date.now();

      // Record wait time (0 for immediate)
      this.recordWaitTime(0);

      return idleEntry.connection;
    }

    // No idle connection available
    // Try to create new connection if under max
    if (this.currentSize < this.maxPoolSize) {
      await this.createConnection();
      const newEntry = this.pool[this.pool.length - 1];
      newEntry.inUse = true;
      newEntry.lastUsed = Date.now();

      this.recordWaitTime(Date.now() - startWait);

      return newEntry.connection;
    }

    // Pool is full, must wait in queue
    return new Promise((resolve, reject) => {
      this.waitingQueue.push({
        resolve,
        reject,
        timestamp: startWait,
      });
    });
  }

  /**
   * Release connection back to pool
   * @private
   */
  private releaseConnection(connection: IConnection): void {
    const entry = this.pool.find((e) => e.connection === connection);

    if (!entry) {
      log.warn('Attempted to release unknown connection', {
        connectionId: this.connectionId,
      });
      return;
    }

    entry.inUse = false;
    entry.lastUsed = Date.now();

    // If there are waiting clients, give them this connection
    if (this.waitingQueue.length > 0) {
      const client = this.waitingQueue.shift()!;
      const waitTime = Date.now() - client.timestamp;

      this.recordWaitTime(waitTime);

      entry.inUse = true;
      entry.lastUsed = Date.now();

      client.resolve(connection);
    }
  }

  /**
   * Record wait time in history
   * @private
   */
  private recordWaitTime(waitTime: number): void {
    this.waitTimes.push(waitTime);

    // Keep only last 100
    if (this.waitTimes.length > 100) {
      this.waitTimes = this.waitTimes.slice(-100);
    }
  }

  /**
   * Start cleanup interval for idle connections
   * @private
   */
  private startCleanupInterval(): void {
    // Cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60 * 1000);
  }

  /**
   * Cleanup idle connections beyond idle timeout
   * @private
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    let cleaned = 0;

    for (let i = this.pool.length - 1; i >= 0; i--) {
      const entry = this.pool[i];

      // Don't remove if:
      // - Connection is in use
      // - Pool would go below minimum
      // - Connection not idle long enough
      if (entry.inUse || this.currentSize <= this.minPoolSize) {
        continue;
      }

      const idleTime = now - entry.lastUsed;
      if (idleTime > this.idleTimeout) {
        // Close and remove
        entry.connection.close().catch((err) => {
          log.error('Error closing idle connection', {
            connectionId: this.connectionId,
            error: err.message,
          });
        });

        this.pool.splice(i, 1);
        this.currentSize--;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      log.debug('Cleaned up idle connections', {
        connectionId: this.connectionId,
        cleaned,
        currentSize: this.currentSize,
      });
    }
  }
}
