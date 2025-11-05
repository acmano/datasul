// src/shared/logging/__tests__/controller.test.ts

import { Request, Response, NextFunction } from 'express';
import { logFromFrontendController, logBatchFromFrontendController } from '../controller';

// Mock do logger
jest.mock('@shared/utils/logger', () => ({
  logFromFrontend: jest.fn(),
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logFromFrontend, log } from '@shared/utils/logger';

describe('LoggingController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockReq = {
      body: {},
      id: 'test-correlation-id',
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };

    mockNext = jest.fn();
  });

  describe('logFromFrontendController', () => {
    it('deve logar mensagem de erro com sucesso', async () => {
      mockReq.body = {
        level: 'error',
        message: 'Test error from frontend',
        timestamp: new Date().toISOString(),
        url: '/test',
        userAgent: 'Mozilla/5.0',
      };

      await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Log registrado com sucesso',
        correlationId: 'test-correlation-id',
      });
      expect(logFromFrontend).toHaveBeenCalled();
    });

    it('deve incluir correlation ID do request no log de auditoria', async () => {
      mockReq.body = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };

      await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      // Verificar que log.debug foi chamado com correlation ID
      expect(log.debug).toHaveBeenCalledWith(
        'Log recebido do frontend',
        expect.objectContaining({
          correlationId: 'test-correlation-id',
        })
      );
    });

    it('deve aceitar context opcional', async () => {
      mockReq.body = {
        level: 'warn',
        message: 'Test warning',
        context: { userId: '123', action: 'click' },
        timestamp: new Date().toISOString(),
      };

      await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(logFromFrontend).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: 'Test warning',
          context: { userId: '123', action: 'click' },
        })
      );
    });

    it('deve aceitar todos os níveis de log válidos', async () => {
      const levels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];

      for (const level of levels) {
        jest.clearAllMocks();

        mockReq.body = {
          level,
          message: `Test ${level} message`,
          timestamp: new Date().toISOString(),
        };

        await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(logFromFrontend).toHaveBeenCalledWith(expect.objectContaining({ level }));
      }
    });

    it('deve incluir url e userAgent quando fornecidos', async () => {
      mockReq.body = {
        level: 'error',
        message: 'Page load error',
        timestamp: new Date().toISOString(),
        url: '/dashboard',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      };

      await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(logFromFrontend).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/dashboard',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        })
      );
    });

    it('deve chamar next com erro se logFromFrontend falhar', async () => {
      mockReq.body = {
        level: 'error',
        message: 'Test',
        timestamp: new Date().toISOString(),
      };

      const testError = new Error('Logger failed');
      (logFromFrontend as jest.Mock).mockImplementation(() => {
        throw testError;
      });

      await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(log.error).toHaveBeenCalledWith(
        'Erro ao processar log do frontend',
        expect.objectContaining({
          correlationId: 'test-correlation-id',
          error: 'Logger failed',
        })
      );
    });

    it('deve processar mensagens longas sem erros', async () => {
      const longMessage = 'A'.repeat(500);
      mockReq.body = {
        level: 'info',
        message: longMessage,
        timestamp: new Date().toISOString(),
      };

      await logFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(logFromFrontend).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        })
      );
    });
  });

  describe('logBatchFromFrontendController', () => {
    it('deve processar batch de logs com sucesso', async () => {
      mockReq.body = {
        logs: [
          {
            level: 'info',
            message: 'Log 1',
            timestamp: new Date().toISOString(),
          },
          {
            level: 'error',
            message: 'Log 2',
            timestamp: new Date().toISOString(),
          },
          {
            level: 'warn',
            message: 'Log 3',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3,
          correlationId: 'test-correlation-id',
        })
      );
    });

    it('deve logar cada item do batch', async () => {
      mockReq.body = {
        logs: [
          {
            level: 'info',
            message: 'Batch log 1',
            timestamp: new Date().toISOString(),
          },
          {
            level: 'error',
            message: 'Batch log 2',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(logFromFrontend).toHaveBeenCalledTimes(2);
      expect(logFromFrontend).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Batch log 1' })
      );
      expect(logFromFrontend).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Batch log 2' })
      );
    });

    it('deve aceitar array vazio', async () => {
      mockReq.body = { logs: [] };

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 0,
          correlationId: 'test-correlation-id',
        })
      );
      expect(logFromFrontend).not.toHaveBeenCalled();
    });

    it('deve registrar auditoria com contagem de níveis', async () => {
      mockReq.body = {
        logs: [
          {
            level: 'info',
            message: 'Info 1',
            timestamp: new Date().toISOString(),
          },
          {
            level: 'info',
            message: 'Info 2',
            timestamp: new Date().toISOString(),
          },
          {
            level: 'error',
            message: 'Error 1',
            timestamp: new Date().toISOString(),
          },
          {
            level: 'warn',
            message: 'Warn 1',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(log.debug).toHaveBeenCalledWith(
        'Batch de logs recebido do frontend',
        expect.objectContaining({
          correlationId: 'test-correlation-id',
          count: 4,
          levels: {
            info: 2,
            error: 1,
            warn: 1,
          },
        })
      );
    });

    it('deve processar batch com diferentes contextos', async () => {
      mockReq.body = {
        logs: [
          {
            level: 'info',
            message: 'User action',
            context: { userId: 'user1', action: 'click' },
            timestamp: new Date().toISOString(),
          },
          {
            level: 'error',
            message: 'API error',
            context: { endpoint: '/api/data', status: 500 },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(logFromFrontend).toHaveBeenCalledTimes(2);
      // Verifica que foi chamado com contextos (ordem pode variar)
      const calls = (logFromFrontend as jest.Mock).mock.calls;
      expect(calls[0][0]).toHaveProperty('context');
      expect(calls[1][0]).toHaveProperty('context');
    });

    it('deve chamar next com erro se processamento falhar', async () => {
      mockReq.body = {
        logs: [
          {
            level: 'info',
            message: 'Test',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const testError = new Error('Batch processing failed');
      (logFromFrontend as jest.Mock).mockImplementation(() => {
        throw testError;
      });

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(log.error).toHaveBeenCalledWith(
        'Erro ao processar batch de logs do frontend',
        expect.objectContaining({
          correlationId: 'test-correlation-id',
        })
      );
    });

    it('deve processar batch com 10 logs', async () => {
      const logs = Array.from({ length: 10 }, (_, i) => ({
        level: 'info' as const,
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));

      mockReq.body = { logs };

      await logBatchFromFrontendController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 10,
        })
      );
      expect(logFromFrontend).toHaveBeenCalledTimes(10);
    });
  });
});
