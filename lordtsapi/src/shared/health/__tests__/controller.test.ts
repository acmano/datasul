// src/shared/health/__tests__/controller.test.ts

/**
 * @fileoverview Unit tests for ConnectionHealthController
 *
 * Tests all controller endpoints:
 * - List all connections
 * - Check single connection
 * - Check by environment
 * - Check by system
 * - Get active connections
 * - Cache management
 *
 * @module shared/health/__tests__
 */

// Mock MUST be before imports
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

jest.mock('../service');

import { Request, Response } from 'express';
import { ConnectionHealthController } from '../controller';
import { ConnectionHealthService } from '../service';

describe('ConnectionHealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      id: 'req-123',
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('listAllConnections', () => {
    it('deve retornar status 200 quando todas as conexões estão healthy', async () => {
      const mockResult = {
        success: true,
        timestamp: new Date(),
        connections: [
          {
            dsn: 'DtsPrdEmp',
            description: 'Datasul Production - Empresa',
            connected: true,
            responseTime: 45,
            lastChecked: new Date(),
          },
        ],
        summary: {
          total: 1,
          healthy: 1,
          unhealthy: 0,
          healthPercentage: 100,
        },
        correlationId: 'req-123',
      };

      (ConnectionHealthService.checkAllConnections as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.listAllConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkAllConnections).toHaveBeenCalledWith('req-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar status 503 quando há conexões unhealthy', async () => {
      const mockResult = {
        success: false,
        timestamp: new Date(),
        connections: [],
        summary: {
          total: 2,
          healthy: 1,
          unhealthy: 1,
          healthPercentage: 50,
        },
      };

      (ConnectionHealthService.checkAllConnections as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.listAllConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve passar correlation ID para o service', async () => {
      mockRequest.id = 'custom-req-id';

      (ConnectionHealthService.checkAllConnections as jest.Mock).mockResolvedValue({
        success: true,
        connections: [],
        summary: { total: 0, healthy: 0, unhealthy: 0, healthPercentage: 0 },
      });

      await ConnectionHealthController.listAllConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkAllConnections).toHaveBeenCalledWith('custom-req-id');
    });
  });

  describe('checkSingleConnection', () => {
    it('deve retornar status 200 quando conexão está healthy', async () => {
      mockRequest.params = { dsn: 'DtsPrdEmp' };

      const mockResult = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        connected: true,
        responseTime: 45,
        lastChecked: new Date(),
      };

      (ConnectionHealthService.checkConnection as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.checkSingleConnection(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkConnection).toHaveBeenCalledWith('DtsPrdEmp', 'req-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar status 503 quando conexão está unhealthy', async () => {
      mockRequest.params = { dsn: 'DtsTstEmp' };

      const mockResult = {
        dsn: 'DtsTstEmp',
        description: 'Datasul Test - Empresa',
        connected: false,
        responseTime: 5000,
        lastError: 'Connection timeout',
        lastChecked: new Date(),
      };

      (ConnectionHealthService.checkConnection as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.checkSingleConnection(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve usar DSN do parâmetro da rota', async () => {
      mockRequest.params = { dsn: 'LgxDev' };

      (ConnectionHealthService.checkConnection as jest.Mock).mockResolvedValue({
        dsn: 'LgxDev',
        connected: true,
      });

      await ConnectionHealthController.checkSingleConnection(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkConnection).toHaveBeenCalledWith('LgxDev', 'req-123');
    });
  });

  describe('checkByEnvironment', () => {
    it('deve verificar conexões de um ambiente específico', async () => {
      mockRequest.params = { env: 'production' };

      const mockResult = {
        success: true,
        timestamp: new Date(),
        connections: [
          {
            dsn: 'DtsPrdEmp',
            description: 'Datasul Production - Empresa',
            connected: true,
          },
          {
            dsn: 'DtsPrdMult',
            description: 'Datasul Production - MULT',
            connected: true,
          },
        ],
        summary: {
          total: 2,
          healthy: 2,
          unhealthy: 0,
          healthPercentage: 100,
        },
      };

      (ConnectionHealthService.checkConnectionsByEnvironment as jest.Mock).mockResolvedValue(
        mockResult
      );

      await ConnectionHealthController.checkByEnvironment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkConnectionsByEnvironment).toHaveBeenCalledWith(
        'production',
        'req-123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar status 503 quando nem todas as conexões do ambiente estão healthy', async () => {
      mockRequest.params = { env: 'test' };

      const mockResult = {
        success: false,
        connections: [],
        summary: {
          total: 2,
          healthy: 1,
          unhealthy: 1,
          healthPercentage: 50,
        },
      };

      (ConnectionHealthService.checkConnectionsByEnvironment as jest.Mock).mockResolvedValue(
        mockResult
      );

      await ConnectionHealthController.checkByEnvironment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });

    it('deve aceitar diferentes nomes de ambiente', async () => {
      (ConnectionHealthService.checkConnectionsByEnvironment as jest.Mock).mockResolvedValue({
        success: true,
        connections: [],
        summary: { total: 0, healthy: 0, unhealthy: 0, healthPercentage: 0 },
      });

      mockRequest.params = { env: 'homologation' };
      await ConnectionHealthController.checkByEnvironment(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(ConnectionHealthService.checkConnectionsByEnvironment).toHaveBeenCalledWith(
        'homologation',
        'req-123'
      );

      mockRequest.params = { env: 'development' };
      await ConnectionHealthController.checkByEnvironment(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(ConnectionHealthService.checkConnectionsByEnvironment).toHaveBeenCalledWith(
        'development',
        'req-123'
      );
    });
  });

  describe('checkBySystem', () => {
    it('deve verificar todas as conexões Datasul', async () => {
      mockRequest.params = { system: 'datasul' };

      const mockResult = {
        success: true,
        timestamp: new Date(),
        connections: [
          { dsn: 'DtsPrdEmp', connected: true },
          { dsn: 'DtsTstEmp', connected: true },
        ],
        summary: {
          total: 2,
          healthy: 2,
          unhealthy: 0,
          healthPercentage: 100,
        },
      };

      (ConnectionHealthService.checkConnectionsBySystem as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.checkBySystem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkConnectionsBySystem).toHaveBeenCalledWith(
        'datasul',
        'req-123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve verificar todas as conexões Informix', async () => {
      mockRequest.params = { system: 'informix' };

      const mockResult = {
        success: true,
        connections: [{ dsn: 'LgxDev', connected: true }],
        summary: {
          total: 1,
          healthy: 1,
          unhealthy: 0,
          healthPercentage: 100,
        },
      };

      (ConnectionHealthService.checkConnectionsBySystem as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.checkBySystem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkConnectionsBySystem).toHaveBeenCalledWith(
        'informix',
        'req-123'
      );
    });

    it('deve retornar status 503 quando há conexões unhealthy', async () => {
      mockRequest.params = { system: 'datasul' };

      const mockResult = {
        success: false,
        connections: [],
        summary: {
          total: 6,
          healthy: 4,
          unhealthy: 2,
          healthPercentage: 67,
        },
      };

      (ConnectionHealthService.checkConnectionsBySystem as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.checkBySystem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });
  });

  describe('getActiveConnections', () => {
    it('deve retornar informações das conexões ativas', async () => {
      const mockStatus = {
        totalConnections: 2,
        activeConnections: [
          {
            dsn: 'DtsPrdEmp',
            description: 'Datasul Production - Empresa',
            lastUsed: new Date(),
            activeQueries: 1,
            systemType: 'datasul',
            environment: 'production',
          },
          {
            dsn: 'LgxDev',
            description: 'Logix Development',
            lastUsed: new Date(),
            activeQueries: 0,
            systemType: 'informix',
            environment: 'development',
          },
        ],
        timestamp: new Date(),
      };

      (ConnectionHealthService.getActiveConnectionsInfo as jest.Mock).mockReturnValue(mockStatus);

      await ConnectionHealthController.getActiveConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.getActiveConnectionsInfo).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockStatus);
    });

    it('deve retornar status 200 mesmo com pool vazio', async () => {
      const mockStatus = {
        totalConnections: 0,
        activeConnections: [],
        timestamp: new Date(),
      };

      (ConnectionHealthService.getActiveConnectionsInfo as jest.Mock).mockReturnValue(mockStatus);

      await ConnectionHealthController.getActiveConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockStatus);
    });
  });

  describe('clearCache', () => {
    it('deve limpar cache e retornar sucesso', async () => {
      (ConnectionHealthService.clearCache as jest.Mock).mockReturnValue(undefined);

      await ConnectionHealthController.clearCache(mockRequest as Request, mockResponse as Response);

      expect(ConnectionHealthService.clearCache).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Health check cache cleared',
          correlationId: 'req-123',
        })
      );
    });

    it('deve incluir timestamp na resposta', async () => {
      (ConnectionHealthService.clearCache as jest.Mock).mockReturnValue(undefined);

      await ConnectionHealthController.clearCache(mockRequest as Request, mockResponse as Response);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    it('deve incluir correlation ID na resposta', async () => {
      mockRequest.id = 'custom-corr-id';

      (ConnectionHealthService.clearCache as jest.Mock).mockReturnValue(undefined);

      await ConnectionHealthController.clearCache(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'custom-corr-id',
        })
      );
    });
  });

  describe('getCacheStats', () => {
    it('deve retornar estatísticas do cache', async () => {
      const mockStats = {
        size: 5,
        entries: ['DtsPrdEmp', 'DtsPrdMult', 'LgxDev', 'LgxPrd', 'DtsTstEmp'],
      };

      (ConnectionHealthService.getCacheStats as jest.Mock).mockReturnValue(mockStats);

      await ConnectionHealthController.getCacheStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.getCacheStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 5,
          entries: expect.arrayContaining(['DtsPrdEmp', 'LgxDev']),
          correlationId: 'req-123',
        })
      );
    });

    it('deve retornar cache vazio quando não há entradas', async () => {
      const mockStats = {
        size: 0,
        entries: [],
      };

      (ConnectionHealthService.getCacheStats as jest.Mock).mockReturnValue(mockStats);

      await ConnectionHealthController.getCacheStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 0,
          entries: [],
        })
      );
    });

    it('deve incluir timestamp na resposta', async () => {
      (ConnectionHealthService.getCacheStats as jest.Mock).mockReturnValue({
        size: 0,
        entries: [],
      });

      await ConnectionHealthController.getCacheStats(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros do service em listAllConnections', async () => {
      const serviceError = new Error('Service error');
      (ConnectionHealthService.checkAllConnections as jest.Mock).mockRejectedValue(serviceError);

      // asyncHandler catches the error, so we just verify it was called
      // The error is handled by Express error middleware
      await ConnectionHealthController.listAllConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkAllConnections).toHaveBeenCalled();
    });

    it('deve lidar com erros do service em checkSingleConnection', async () => {
      mockRequest.params = { dsn: 'DtsPrdEmp' };
      const serviceError = new Error('Connection error');
      (ConnectionHealthService.checkConnection as jest.Mock).mockRejectedValue(serviceError);

      // asyncHandler catches the error, so we just verify it was called
      await ConnectionHealthController.checkSingleConnection(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkConnection).toHaveBeenCalledWith('DtsPrdEmp', 'req-123');
    });
  });

  describe('Correlation ID Handling', () => {
    it('deve usar correlation ID do request em todos os métodos', async () => {
      mockRequest.id = 'test-corr-id-123';

      (ConnectionHealthService.checkAllConnections as jest.Mock).mockResolvedValue({
        success: true,
        connections: [],
        summary: { total: 0, healthy: 0, unhealthy: 0, healthPercentage: 0 },
      });

      await ConnectionHealthController.listAllConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ConnectionHealthService.checkAllConnections).toHaveBeenCalledWith('test-corr-id-123');
    });

    it('deve incluir correlation ID em respostas de cache', async () => {
      mockRequest.id = 'cache-corr-id';

      (ConnectionHealthService.clearCache as jest.Mock).mockReturnValue(undefined);

      await ConnectionHealthController.clearCache(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'cache-corr-id',
        })
      );
    });
  });

  describe('Response Format', () => {
    it('deve retornar formato correto para listAllConnections', async () => {
      const timestamp = new Date();
      const mockResult = {
        success: true,
        timestamp,
        connections: [{ dsn: 'DtsPrdEmp', connected: true }],
        summary: { total: 1, healthy: 1, unhealthy: 0, healthPercentage: 100 },
        correlationId: 'req-123',
      };

      (ConnectionHealthService.checkAllConnections as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.listAllConnections(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp,
        connections: expect.any(Array),
        summary: expect.objectContaining({
          total: expect.any(Number),
          healthy: expect.any(Number),
          unhealthy: expect.any(Number),
          healthPercentage: expect.any(Number),
        }),
        correlationId: expect.any(String),
      });
    });

    it('deve retornar formato correto para checkSingleConnection', async () => {
      mockRequest.params = { dsn: 'DtsPrdEmp' };

      const mockResult = {
        dsn: 'DtsPrdEmp',
        description: 'Datasul Production - Empresa',
        connected: true,
        responseTime: 45,
        lastChecked: new Date(),
        systemType: 'datasul',
        environment: 'production',
        purpose: 'emp',
      };

      (ConnectionHealthService.checkConnection as jest.Mock).mockResolvedValue(mockResult);

      await ConnectionHealthController.checkSingleConnection(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        dsn: expect.any(String),
        description: expect.any(String),
        connected: expect.any(Boolean),
        responseTime: expect.any(Number),
        lastChecked: expect.any(Date),
        systemType: expect.any(String),
        environment: expect.any(String),
        purpose: expect.any(String),
      });
    });
  });
});
