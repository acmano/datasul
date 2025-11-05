// src/infrastructure/cache/adapters/__tests__/RedisCacheAdapter.test.ts

import { RedisCacheAdapter } from '../RedisCacheAdapter';
import Redis from 'ioredis';

// Mock do logger
jest.mock('@shared/utils/logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do logger no caminho relativo também (caso seja usado)
jest.mock('../../../shared/utils/logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do ioredis
jest.mock('ioredis');

describe('RedisCacheAdapter', () => {
  let cache: RedisCacheAdapter;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Criar mock do cliente Redis
    mockRedis = {
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      flushall: jest.fn(),
      scan: jest.fn(),
      quit: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
      options: {
        host: 'localhost',
        port: 6379,
      },
    } as any;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);
  });

  afterEach(async () => {
    if (cache) {
      await cache.close();
    }
  });

  describe('Constructor', () => {
    it('deve criar instância com URL string', () => {
      // Act
      cache = new RedisCacheAdapter('redis://localhost:6379');

      // Assert
      expect(cache).toBeInstanceOf(RedisCacheAdapter);
      expect(Redis).toHaveBeenCalled();
    });

    it('deve criar instância com opções', () => {
      // Arrange
      const options = { host: 'localhost', port: 6379 };

      // Act
      cache = new RedisCacheAdapter(options);

      // Assert
      expect(cache).toBeInstanceOf(RedisCacheAdapter);
      expect(Redis).toHaveBeenCalledWith(options);
    });

    it('deve criar instância com nome customizado', () => {
      // Act
      cache = new RedisCacheAdapter('redis://localhost:6379', 'CustomRedis');

      // Assert
      expect(cache).toBeInstanceOf(RedisCacheAdapter);
    });

    it('deve configurar event handlers', () => {
      // Act
      cache = new RedisCacheAdapter('redis://localhost:6379');

      // Assert
      expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
    });
  });

  describe('Event Handlers', () => {
    it('deve marcar ready como true no evento ready', () => {
      // Arrange
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });

      // Act
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();

      // Assert
      expect(cache.isReady()).resolves.toBe(true);
    });

    it('deve marcar ready como false no evento close', async () => {
      // Arrange
      let readyHandler: () => void = () => {};
      let closeHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        if (event === 'close') closeHandler = handler;
        return mockRedis;
      });

      // Act
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async
      const readyBefore = await cache.isReady();
      closeHandler();
      const readyAfter = await cache.isReady();

      // Assert
      expect(readyBefore).toBe(true);
      expect(readyAfter).toBe(false);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      // Simular que Redis está pronto
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
    });

    it('deve retornar undefined quando Redis não está pronto', async () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');
      // Não chamar ready handler

      // Act
      const result = await cache.get('key');

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve retornar valor deserializado', async () => {
      // Arrange
      const value = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      // Act
      const result = await cache.get('key');

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith('key');
      expect(result).toEqual(value);
    });

    it('deve retornar undefined quando chave não existe', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null);

      // Act
      const result = await cache.get('nonexistent');

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve retornar diferentes tipos de dados', async () => {
      // Arrange
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify('string'))
        .mockResolvedValueOnce(JSON.stringify(123))
        .mockResolvedValueOnce(JSON.stringify({ a: 1 }))
        .mockResolvedValueOnce(JSON.stringify([1, 2, 3]))
        .mockResolvedValueOnce(JSON.stringify(true));

      // Act & Assert
      expect(await cache.get('string')).toBe('string');
      expect(await cache.get('number')).toBe(123);
      expect(await cache.get('object')).toEqual({ a: 1 });
      expect(await cache.get('array')).toEqual([1, 2, 3]);
      expect(await cache.get('boolean')).toBe(true);
    });

    it('deve retornar undefined em caso de erro', async () => {
      // Arrange
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await cache.get('key');

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined em caso de erro de parse', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue('invalid json {');

      // Act
      const result = await cache.get('key');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    beforeEach(() => {
      // Simular que Redis está pronto
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
    });

    it('deve retornar false quando Redis não está pronto', async () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');
      // Não chamar ready handler

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });

    it('deve armazenar valor sem TTL', async () => {
      // Arrange
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify('value'));
      expect(result).toBe(true);
    });

    it('deve armazenar valor com TTL', async () => {
      // Arrange
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await cache.set('key', 'value', 600);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith('key', 600, JSON.stringify('value'));
      expect(result).toBe(true);
    });

    it('deve serializar objetos complexos', async () => {
      // Arrange
      const complexObject = {
        id: 1,
        name: 'Test',
        nested: {
          value: 'nested',
          array: [1, 2, 3],
        },
      };
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const result = await cache.set('complex', complexObject);

      // Assert
      expect(mockRedis.set).toHaveBeenCalledWith('complex', JSON.stringify(complexObject));
      expect(result).toBe(true);
    });

    it('deve retornar false em caso de erro', async () => {
      // Arrange
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });

    it('não deve usar setex quando TTL é 0', async () => {
      // Arrange
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const result = await cache.set('key', 'value', 0);

      // Assert
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('não deve usar setex quando TTL é negativo', async () => {
      // Arrange
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const result = await cache.set('key', 'value', -1);

      // Assert
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Simular que Redis está pronto
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
    });

    it('deve retornar 0 quando Redis não está pronto', async () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');
      // Não chamar ready handler

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(0);
    });

    it('deve remover chave existente', async () => {
      // Arrange
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(mockRedis.del).toHaveBeenCalledWith('key');
      expect(result).toBe(1);
    });

    it('deve retornar 0 para chave inexistente', async () => {
      // Arrange
      mockRedis.del.mockResolvedValue(0);

      // Act
      const result = await cache.delete('nonexistent');

      // Assert
      expect(result).toBe(0);
    });

    it('deve retornar 0 em caso de erro', async () => {
      // Arrange
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      // Simular que Redis está pronto
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
    });

    it('não deve fazer nada quando Redis não está pronto', async () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');
      // Não chamar ready handler

      // Act
      await cache.flush();

      // Assert
      expect(mockRedis.flushall).not.toHaveBeenCalled();
    });

    it('deve chamar flushall', async () => {
      // Arrange
      mockRedis.flushall.mockResolvedValue('OK');

      // Act
      await cache.flush();

      // Assert
      expect(mockRedis.flushall).toHaveBeenCalled();
    });

    it('não deve lançar erro em caso de falha', async () => {
      // Arrange
      mockRedis.flushall.mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(cache.flush()).resolves.not.toThrow();
    });
  });

  describe('keys', () => {
    beforeEach(() => {
      // Simular que Redis está pronto
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
    });

    it('deve retornar array vazio quando Redis não está pronto', async () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');
      // Não chamar ready handler

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual([]);
    });

    it('deve retornar todas as chaves com pattern padrão', async () => {
      // Arrange
      mockRedis.scan.mockResolvedValueOnce(['0', ['key1', 'key2', 'key3']]);

      // Act
      const result = await cache.keys();

      // Assert
      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', '*', 'COUNT', 100);
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('deve retornar chaves com pattern customizado', async () => {
      // Arrange
      mockRedis.scan.mockResolvedValueOnce(['0', ['user:1', 'user:2']]);

      // Act
      const result = await cache.keys('user:*');

      // Assert
      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'user:*', 'COUNT', 100);
      expect(result).toEqual(['user:1', 'user:2']);
    });

    it('deve lidar com paginação do SCAN', async () => {
      // Arrange
      mockRedis.scan
        .mockResolvedValueOnce(['100', ['key1', 'key2']])
        .mockResolvedValueOnce(['200', ['key3', 'key4']])
        .mockResolvedValueOnce(['0', ['key5']]);

      // Act
      const result = await cache.keys();

      // Assert
      expect(mockRedis.scan).toHaveBeenCalledTimes(3);
      expect(result).toEqual(['key1', 'key2', 'key3', 'key4', 'key5']);
    });

    it('deve retornar array vazio quando não há chaves', async () => {
      // Arrange
      mockRedis.scan.mockResolvedValueOnce(['0', []]);

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio em caso de erro', async () => {
      // Arrange
      mockRedis.scan.mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('isReady', () => {
    it('deve retornar false inicialmente', async () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(false);
    });

    it('deve retornar true após evento ready', async () => {
      // Arrange
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });

      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(true);
    });

    it('deve retornar false após evento close', async () => {
      // Arrange
      let readyHandler: () => void = () => {};
      let closeHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        if (event === 'close') closeHandler = handler;
        return mockRedis;
      });

      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
      closeHandler();

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(false);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      cache = new RedisCacheAdapter('redis://localhost:6379');
    });

    it('deve chamar quit no Redis', async () => {
      // Arrange
      mockRedis.quit.mockResolvedValue('OK');

      // Act
      await cache.close();

      // Assert
      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('deve marcar ready como false', async () => {
      // Arrange
      mockRedis.quit.mockResolvedValue('OK');

      // Act
      await cache.close();
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(false);
    });

    it('não deve lançar erro em caso de falha', async () => {
      // Arrange
      mockRedis.quit.mockRejectedValue(new Error('Quit error'));

      // Act & Assert
      await expect(cache.close()).resolves.not.toThrow();
    });
  });

  describe('ping', () => {
    beforeEach(() => {
      cache = new RedisCacheAdapter('redis://localhost:6379');
    });

    it('deve retornar PONG', async () => {
      // Arrange
      mockRedis.ping.mockResolvedValue('PONG');

      // Act
      const result = await cache.ping();

      // Assert
      expect(mockRedis.ping).toHaveBeenCalled();
      expect(result).toBe('PONG');
    });

    it('deve propagar erro', async () => {
      // Arrange
      mockRedis.ping.mockRejectedValue(new Error('Connection error'));

      // Act & Assert
      await expect(cache.ping()).rejects.toThrow('Connection error');
    });
  });

  describe('info', () => {
    beforeEach(() => {
      cache = new RedisCacheAdapter('redis://localhost:6379');
    });

    it('deve retornar informações do Redis', async () => {
      // Arrange
      const infoString = '# Server\nredis_version:6.2.0';
      mockRedis.info.mockResolvedValue(infoString);

      // Act
      const result = await cache.info();

      // Assert
      expect(mockRedis.info).toHaveBeenCalled();
      expect(result).toBe(infoString);
    });

    it('deve propagar erro', async () => {
      // Arrange
      mockRedis.info.mockRejectedValue(new Error('Info error'));

      // Act & Assert
      await expect(cache.info()).rejects.toThrow('Info error');
    });
  });

  describe('getClient', () => {
    it('deve retornar cliente Redis', () => {
      // Arrange
      cache = new RedisCacheAdapter('redis://localhost:6379');

      // Act
      const client = cache.getClient();

      // Assert
      expect(client).toBe(mockRedis);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      // Simular que Redis está pronto
      let readyHandler: () => void = () => {};
      mockRedis.on.mockImplementation((event, handler) => {
        if (event === 'ready') readyHandler = handler;
        return mockRedis;
      });
      cache = new RedisCacheAdapter('redis://localhost:6379');
      readyHandler();
    });

    it('deve manter dados após múltiplas operações', async () => {
      // Arrange
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify('value2'))
        .mockResolvedValueOnce(JSON.stringify('value3'));
      mockRedis.del.mockResolvedValue(1);

      // Act
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2', 600);
      await cache.delete('key1');
      await cache.set('key3', 'value3');

      // Assert
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.get('key2')).toBe('value2');
      expect(await cache.get('key3')).toBe('value3');
    });

    it('deve funcionar com operações concorrentes', async () => {
      // Arrange
      mockRedis.setex.mockResolvedValue('OK');
      const operations = [];

      // Act
      for (let i = 0; i < 10; i++) {
        operations.push(cache.set(`key${i}`, `value${i}`, 300));
      }
      await Promise.all(operations);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledTimes(10);
    });
  });
});
