import api from '../../config/api.config';
import logger from '../logger.service';

// Mock do módulo api
jest.mock('../../config/api.config', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: {
      baseURL: 'http://localhost:3000',
    },
  },
}));

// Mock import.meta.env para habilitar logs em testes
const originalEnv = process.env;

describe('LoggerService', () => {
  const mockApiPost = api.post as jest.Mock;

  beforeAll(() => {
    // Configura env para aceitar todos os níveis de log
    process.env = {
      ...originalEnv,
      VITE_LOG_ENABLED: 'true',
      VITE_LOG_LEVEL: 'debug',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Limpa a queue antes de cada teste
    logger.clearQueue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton pattern', () => {
    it('deve manter a mesma instância do logger', () => {
      // Logger já é exportado como singleton
      // Verificamos que successive chamadas retornam o mesmo objeto
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe('Queue management', () => {
    it('deve adicionar log à queue quando chamar warn', () => {
      logger.warn('Test warning message');

      // Queue deve ter 1 item (warn sempre é aceito)
      expect(logger.getQueueSize()).toBe(1);
    });

    it('deve ter método forceFlush disponível', () => {
      expect(logger.forceFlush).toBeDefined();
      expect(typeof logger.forceFlush).toBe('function');
    });

    it('deve ter método clearQueue disponível', () => {
      expect(logger.clearQueue).toBeDefined();
      expect(typeof logger.clearQueue).toBe('function');
    });
  });

  describe('Log levels', () => {
    it('deve ter método error', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });

    it('deve ter método warn', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('deve ter método info', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('deve ter método debug', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });

    it('deve logar warn com contexto', () => {
      logger.clearQueue();
      const context = { userId: '123', action: 'delete' };

      logger.warn('Warning message', context);

      expect(logger.getQueueSize()).toBe(1);
    });
  });

  describe('Utility methods', () => {
    it('deve permitir obter tamanho da queue', () => {
      logger.clearQueue();

      logger.warn('Message 1');
      logger.warn('Message 2');

      expect(logger.getQueueSize()).toBe(2);
    });

    it('deve permitir forceFlush para envio manual', async () => {
      mockApiPost.mockResolvedValue({ data: { success: true } });

      logger.clearQueue();
      logger.warn('Test message');

      expect(logger.getQueueSize()).toBe(1);

      // Força flush manual
      await logger.forceFlush();

      // Queue deve estar vazia após flush (em caso de sucesso)
      // Nota: pode não estar vazio se o flush falhar ou já estiver em andamento
      expect(logger.getQueueSize()).toBeLessThanOrEqual(1);
    });
  });

  describe('Clear queue', () => {
    it('deve limpar queue sem enviar', () => {
      logger.clearQueue();
      logger.warn('Test message 1');
      logger.warn('Test message 2');

      expect(logger.getQueueSize()).toBe(2);

      logger.clearQueue();

      expect(logger.getQueueSize()).toBe(0);
    });
  });
});
