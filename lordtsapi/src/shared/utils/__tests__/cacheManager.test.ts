// src/shared/utils/__tests__/cacheManager.test.ts

import { CacheManager, generateCacheKey } from '../cacheManager';
import { MemoryCacheAdapter } from '../cache/MemoryCacheAdapter';

// Mock do logger
jest.mock('../logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock dos adapters
jest.mock('../cache/MemoryCacheAdapter');
jest.mock('../cache/RedisCacheAdapter');
jest.mock('../cache/LayeredCacheAdapter');

describe('CacheManager', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    // Resetar estado estático
    (CacheManager as any).adapter = null;
    (CacheManager as any).enabled = false;
    (CacheManager as any).strategy = 'memory';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('deve inicializar com estratégia memory por padrão', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'true';
      process.env.CACHE_STRATEGY = 'memory';

      // Act
      CacheManager.initialize();

      // Assert
      expect(MemoryCacheAdapter).toHaveBeenCalled();
    });

    it('deve inicializar com estratégia fornecida', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'true';

      // Act
      CacheManager.initialize('memory');

      // Assert
      expect(MemoryCacheAdapter).toHaveBeenCalled();
    });

    it('deve respeitar CACHE_ENABLED=false', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';

      // Act
      CacheManager.initialize();

      // Assert
      expect(MemoryCacheAdapter).not.toHaveBeenCalled();
    });

    it('deve usar TTL do environment', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'true';
      process.env.CACHE_DEFAULT_TTL = '600';

      // Act
      CacheManager.initialize('memory');

      // Assert
      expect(MemoryCacheAdapter).toHaveBeenCalledWith(600, 'Cache-Memory');
    });

    it('deve usar TTL padrão quando não fornecido', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'true';
      delete process.env.CACHE_DEFAULT_TTL;

      // Act
      CacheManager.initialize('memory');

      // Assert
      expect(MemoryCacheAdapter).toHaveBeenCalledWith(300, 'Cache-Memory');
    });

    it('deve fazer fallback para memory em caso de erro', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'true';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LayeredCacheAdapter } = require('../cache/LayeredCacheAdapter');
      LayeredCacheAdapter.mockImplementation(() => {
        throw new Error('Init error');
      });

      // Act
      CacheManager.initialize('layered');

      // Assert
      expect(MemoryCacheAdapter).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('deve retornar undefined quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const result = await CacheManager.get('key');

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve chamar adapter.get quando habilitado', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn().mockResolvedValue('value'),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.get('key');

      // Assert
      expect(mockAdapter.get).toHaveBeenCalledWith('key');
      expect(result).toBe('value');
    });

    it('deve retornar undefined em caso de erro', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn().mockRejectedValue(new Error('Get error')),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.get('key');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('deve retornar false quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const result = await CacheManager.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });

    it('deve chamar adapter.set quando habilitado', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn().mockResolvedValue(true),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.set('key', 'value', 600);

      // Assert
      expect(mockAdapter.set).toHaveBeenCalledWith('key', 'value', 600);
      expect(result).toBe(true);
    });

    it('deve retornar false em caso de erro', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn().mockRejectedValue(new Error('Set error')),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('deve retornar 0 quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const result = await CacheManager.delete('key');

      // Assert
      expect(result).toBe(0);
    });

    it('deve chamar adapter.delete quando habilitado', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn().mockResolvedValue(1),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.delete('key');

      // Assert
      expect(mockAdapter.delete).toHaveBeenCalledWith('key');
      expect(result).toBe(1);
    });

    it('deve retornar 0 em caso de erro', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn().mockRejectedValue(new Error('Delete error')),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.delete('key');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('flush', () => {
    it('deve não fazer nada quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act & Assert
      await expect(CacheManager.flush()).resolves.not.toThrow();
    });

    it('deve chamar adapter.flush quando habilitado', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      await CacheManager.flush();

      // Assert
      expect(mockAdapter.flush).toHaveBeenCalled();
    });

    it('não deve lançar erro em caso de falha', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn().mockRejectedValue(new Error('Flush error')),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act & Assert
      await expect(CacheManager.flush()).resolves.not.toThrow();
    });
  });

  describe('keys', () => {
    it('deve retornar array vazio quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const result = await CacheManager.keys();

      // Assert
      expect(result).toEqual([]);
    });

    it('deve chamar adapter.keys quando habilitado', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn().mockResolvedValue(['key1', 'key2']),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.keys('pattern');

      // Assert
      expect(mockAdapter.keys).toHaveBeenCalledWith('pattern');
      expect(result).toEqual(['key1', 'key2']);
    });

    it('deve retornar array vazio em caso de erro', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn().mockRejectedValue(new Error('Keys error')),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.keys();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('invalidate', () => {
    it('deve retornar 0 quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const result = await CacheManager.invalidate('pattern:*');

      // Assert
      expect(result).toBe(0);
    });

    it('deve invalidar chaves por padrão', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn().mockResolvedValue(1),
        flush: jest.fn(),
        keys: jest.fn().mockResolvedValue(['pattern:1', 'pattern:2']),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.invalidate('pattern:*');

      // Assert
      expect(mockAdapter.keys).toHaveBeenCalledWith('pattern:*');
      expect(mockAdapter.delete).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    it('deve retornar 0 quando nenhuma chave encontrada', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.invalidate('pattern:*');

      // Assert
      expect(mockAdapter.delete).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('deve retornar 0 em caso de erro', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn().mockRejectedValue(new Error('Keys error')),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const result = await CacheManager.invalidate('pattern:*');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getOrSet', () => {
    it('deve retornar valor do cache quando existe', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn().mockResolvedValue('cached-value'),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;
      const fetchFn = jest.fn().mockResolvedValue('fetched-value');

      // Act
      const result = await CacheManager.getOrSet('key', fetchFn);

      // Assert
      expect(mockAdapter.get).toHaveBeenCalledWith('key');
      expect(fetchFn).not.toHaveBeenCalled();
      expect(mockAdapter.set).not.toHaveBeenCalled();
      expect(result).toBe('cached-value');
    });

    it('deve executar função e armazenar quando não existe no cache', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(true),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;
      const fetchFn = jest.fn().mockResolvedValue('fetched-value');

      // Act
      const result = await CacheManager.getOrSet('key', fetchFn, 600);

      // Assert
      expect(mockAdapter.get).toHaveBeenCalledWith('key');
      expect(fetchFn).toHaveBeenCalled();
      expect(mockAdapter.set).toHaveBeenCalledWith('key', 'fetched-value', 600);
      expect(result).toBe('fetched-value');
    });

    it('deve funcionar com cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();
      const fetchFn = jest.fn().mockResolvedValue('fetched-value');

      // Act
      const result = await CacheManager.getOrSet('key', fetchFn);

      // Assert
      expect(fetchFn).toHaveBeenCalled();
      expect(result).toBe('fetched-value');
    });
  });

  describe('isReady', () => {
    it('deve retornar false quando cache desabilitado', async () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const ready = await CacheManager.isReady();

      // Assert
      expect(ready).toBe(false);
    });

    it('deve chamar adapter.isReady quando habilitado', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn().mockResolvedValue(true),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const ready = await CacheManager.isReady();

      // Assert
      expect(mockAdapter.isReady).toHaveBeenCalled();
      expect(ready).toBe(true);
    });

    it('deve retornar false em caso de erro', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn().mockRejectedValue(new Error('IsReady error')),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const ready = await CacheManager.isReady();

      // Assert
      expect(ready).toBe(false);
    });
  });

  describe('getStats', () => {
    it('deve retornar stats com enabled false quando desabilitado', () => {
      // Arrange
      process.env.CACHE_ENABLED = 'false';
      CacheManager.initialize();

      // Act
      const stats = CacheManager.getStats();

      // Assert
      expect(stats.enabled).toBe(false);
      expect(stats.strategy).toBe('none');
    });

    it('deve retornar stats do MemoryCacheAdapter', () => {
      // Arrange
      const mockStats = { hits: 10, misses: 5, keys: 3, hitRate: 66.67 };
      const mockAdapter = new MemoryCacheAdapter();
      mockAdapter.getStats = jest.fn().mockReturnValue(mockStats);
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const stats = CacheManager.getStats();

      // Assert
      expect(stats.enabled).toBe(true);
      expect(stats.strategy).toBe('memory');
      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(5);
    });

    it('deve retornar stats básicos quando adapter não tem getStats', () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn(),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      const stats = CacheManager.getStats();

      // Assert
      expect(stats.enabled).toBe(true);
      expect(stats.strategy).toBe('memory');
    });
  });

  describe('close', () => {
    it('deve não fazer nada quando adapter null', async () => {
      // Arrange
      (CacheManager as any).adapter = null;

      // Act & Assert
      await expect(CacheManager.close()).resolves.not.toThrow();
    });

    it('deve chamar adapter.close quando existe', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act
      await CacheManager.close();

      // Assert
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('não deve lançar erro em caso de falha', async () => {
      // Arrange
      const mockAdapter = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        flush: jest.fn(),
        keys: jest.fn(),
        isReady: jest.fn(),
        close: jest.fn().mockRejectedValue(new Error('Close error')),
      };
      process.env.CACHE_ENABLED = 'true';
      CacheManager.initialize('memory');
      (CacheManager as any).adapter = mockAdapter;

      // Act & Assert
      await expect(CacheManager.close()).resolves.not.toThrow();
    });
  });
});

describe('generateCacheKey', () => {
  it('deve gerar chave com múltiplas partes', () => {
    // Act
    const key = generateCacheKey('user', 123, 'profile');

    // Assert
    expect(key).toBe('user:123:profile');
  });

  it('deve gerar chave com uma parte', () => {
    // Act
    const key = generateCacheKey('simple');

    // Assert
    expect(key).toBe('simple');
  });

  it('deve filtrar valores undefined', () => {
    // Act
    const key = generateCacheKey('user', undefined, 'profile');

    // Assert
    expect(key).toBe('user:profile');
  });

  it('deve filtrar valores null', () => {
    // Act
    const key = generateCacheKey('user', null, 'profile');

    // Assert
    expect(key).toBe('user:profile');
  });

  it('deve aceitar números', () => {
    // Act
    const key = generateCacheKey('item', 123, 456);

    // Assert
    expect(key).toBe('item:123:456');
  });

  it('deve aceitar zero', () => {
    // Act
    const key = generateCacheKey('item', 0);

    // Assert
    expect(key).toBe('item:0');
  });

  it('deve retornar string vazia quando todas as partes são inválidas', () => {
    // Act
    const key = generateCacheKey(undefined, null);

    // Assert
    expect(key).toBe('');
  });
});
