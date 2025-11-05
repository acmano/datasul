// src/shared/health/__tests__/service.test.ts

/**
 * @fileoverview Unit tests for ConnectionHealthService
 */

// Mock dependencies BEFORE imports
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@infrastructure/metrics/MetricsManager', () => ({
  MetricsManager: {
    getInstance: jest.fn(() => ({
      isReady: jest.fn(() => true),
    })),
  },
  metricsManager: {
    isReady: jest.fn(() => true),
  },
}));

jest.mock('@infrastructure/database/DatabaseManager', () => ({
  DatabaseManager: {
    healthCheckConnection: jest.fn(),
    getActiveConnections: jest.fn(),
  },
}));

jest.mock('@config/connections.config', () => ({
  findConnectionByDSN: jest.fn(),
  getAllDSNs: jest.fn(),
  getConnectionsByEnvironment: jest.fn(),
  EnvironmentType: {
    PRODUCTION: 'production',
    TEST: 'test',
    HOMOLOGATION: 'homologation',
    DEVELOPMENT: 'development',
    ATUALIZAÇÃO: 'atualização',
    NEW: 'new',
  },
}));

import { ConnectionHealthService } from '../service';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { findConnectionByDSN } from '@config/connections.config';

describe('ConnectionHealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ConnectionHealthService.clearCache();
  });

  describe('checkConnection', () => {
    it('should return healthy result when connection is working', async () => {
      // Arrange
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
        purpose: 'emp',
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (DatabaseManager.healthCheckConnection as jest.Mock).mockResolvedValue({
        connected: true,
        responseTime: 45,
      });

      // Act
      const result = await ConnectionHealthService.checkConnection('DtsPrdEmp');

      // Assert
      expect(result.dsn).toBe('DtsPrdEmp');
      expect(result.connected).toBe(true);
      expect(result.responseTime).toBe(45);
      expect(result.lastError).toBeUndefined();
      expect(result.systemType).toBe('datasul');
      expect(result.environment).toBe('production');
      expect(result.purpose).toBe('emp');
    });

    it('should return unhealthy result when connection fails', async () => {
      // Arrange
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
        purpose: 'emp',
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (DatabaseManager.healthCheckConnection as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      );

      // Act
      const result = await ConnectionHealthService.checkConnection('DtsPrdEmp');

      // Assert
      expect(result.dsn).toBe('DtsPrdEmp');
      expect(result.connected).toBe(false);
      expect(result.lastError).toBe('Connection timeout');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return error when DSN not found', async () => {
      // Arrange
      (findConnectionByDSN as jest.Mock).mockReturnValue(null);

      // Act
      const result = await ConnectionHealthService.checkConnection('InvalidDSN');

      // Assert
      expect(result.dsn).toBe('InvalidDSN');
      expect(result.connected).toBe(false);
      expect(result.lastError).toContain('not found in configuration');
    });

    it('should use cache on subsequent calls', async () => {
      // Arrange
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (DatabaseManager.healthCheckConnection as jest.Mock).mockResolvedValue({
        connected: true,
        responseTime: 45,
      });

      // Act - First call
      await ConnectionHealthService.checkConnection('DtsPrdEmp');

      // Act - Second call (should use cache)
      const result = await ConnectionHealthService.checkConnection('DtsPrdEmp');

      // Assert
      expect(result.connected).toBe(true);
      expect(DatabaseManager.healthCheckConnection).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('checkMultipleConnections', () => {
    it('should check multiple connections in parallel', async () => {
      // Arrange
      const mockConfig1 = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
      };
      const mockConfig2 = {
        dsn: 'DtsPrdMult',
        description: 'Datasul Production - Mult',
        systemType: 'datasul',
        environment: 'production',
      };

      (findConnectionByDSN as jest.Mock).mockImplementation((dsn) => {
        if (dsn === 'DtsPrdEmp') return mockConfig1;
        if (dsn === 'DtsPrdMult') return mockConfig2;
        return null;
      });

      (DatabaseManager.healthCheckConnection as jest.Mock).mockResolvedValue({
        connected: true,
        responseTime: 45,
      });

      // Act
      const result = await ConnectionHealthService.checkMultipleConnections([
        'DtsPrdEmp',
        'DtsPrdMult',
      ]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.connections).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.healthy).toBe(2);
      expect(result.summary.unhealthy).toBe(0);
      expect(result.summary.healthPercentage).toBe(100);
    });

    it('should calculate correct summary with mixed results', async () => {
      // Arrange
      const mockConfig1 = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
      };
      const mockConfig2 = {
        dsn: 'DtsPrdMult',
        description: 'Datasul Production - Mult',
        systemType: 'datasul',
        environment: 'production',
      };

      (findConnectionByDSN as jest.Mock).mockImplementation((dsn) => {
        if (dsn === 'DtsPrdEmp') return mockConfig1;
        if (dsn === 'DtsPrdMult') return mockConfig2;
        return null;
      });

      (DatabaseManager.healthCheckConnection as jest.Mock)
        .mockResolvedValueOnce({
          connected: true,
          responseTime: 45,
        })
        .mockRejectedValueOnce(new Error('Connection failed'));

      // Act
      const result = await ConnectionHealthService.checkMultipleConnections([
        'DtsPrdEmp',
        'DtsPrdMult',
      ]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.connections).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.healthy).toBe(1);
      expect(result.summary.unhealthy).toBe(1);
      expect(result.summary.healthPercentage).toBe(50);
    });
  });

  describe('getActiveConnectionsInfo', () => {
    it('should return active connections from pool', () => {
      // Arrange
      const mockActiveConnections = [
        {
          dsn: 'DtsPrdEmp',
          description: 'Datasul Production - Empresa',
          lastUsed: new Date(),
          activeQueries: 2,
        },
        {
          dsn: 'DtsPrdMult',
          description: 'Datasul Production - Mult',
          lastUsed: new Date(),
          activeQueries: 0,
        },
      ];

      const mockConfig1 = {
        dsn: 'DtsPrdEmp',
        systemType: 'datasul',
        environment: 'production',
      };
      const mockConfig2 = {
        dsn: 'DtsPrdMult',
        systemType: 'datasul',
        environment: 'production',
      };

      (DatabaseManager.getActiveConnections as jest.Mock).mockReturnValue(mockActiveConnections);

      (findConnectionByDSN as jest.Mock).mockImplementation((dsn) => {
        if (dsn === 'DtsPrdEmp') return mockConfig1;
        if (dsn === 'DtsPrdMult') return mockConfig2;
        return null;
      });

      // Act
      const result = ConnectionHealthService.getActiveConnectionsInfo();

      // Assert
      expect(result.totalConnections).toBe(2);
      expect(result.activeConnections).toHaveLength(2);
      expect(result.activeConnections[0].dsn).toBe('DtsPrdEmp');
      expect(result.activeConnections[0].systemType).toBe('datasul');
      expect(result.activeConnections[0].activeQueries).toBe(2);
    });

    it('should return empty array when no active connections', () => {
      // Arrange
      (DatabaseManager.getActiveConnections as jest.Mock).mockReturnValue([]);

      // Act
      const result = ConnectionHealthService.getActiveConnectionsInfo();

      // Assert
      expect(result.totalConnections).toBe(0);
      expect(result.activeConnections).toHaveLength(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', async () => {
      // Arrange
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (DatabaseManager.healthCheckConnection as jest.Mock).mockResolvedValue({
        connected: true,
        responseTime: 45,
      });

      // Add entry to cache
      await ConnectionHealthService.checkConnection('DtsPrdEmp');

      // Act - Clear cache
      ConnectionHealthService.clearCache();

      // Assert - Next call should hit database again
      await ConnectionHealthService.checkConnection('DtsPrdEmp');
      expect(DatabaseManager.healthCheckConnection).toHaveBeenCalledTimes(2);
    });

    it('should return cache stats correctly', async () => {
      // Arrange
      const mockConfig = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        systemType: 'datasul',
        environment: 'production',
      };

      (findConnectionByDSN as jest.Mock).mockReturnValue(mockConfig);
      (DatabaseManager.healthCheckConnection as jest.Mock).mockResolvedValue({
        connected: true,
        responseTime: 45,
      });

      // Add entry to cache
      await ConnectionHealthService.checkConnection('DtsPrdEmp');

      // Act
      const stats = ConnectionHealthService.getCacheStats();

      // Assert
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain('DtsPrdEmp');
    });
  });
});
