// src/infrastructure/cache/adapters/__tests__/LayeredCacheAdapter.test.ts

import { LayeredCacheAdapter } from '../LayeredCacheAdapter';
import type { CacheAdapter } from '../CacheAdapter';

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

describe('LayeredCacheAdapter', () => {
  let cache: LayeredCacheAdapter;
  let mockL1: jest.Mocked<CacheAdapter>;
  let mockL2: jest.Mocked<CacheAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Criar mocks dos adapters L1 e L2
    mockL1 = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      flush: jest.fn(),
      keys: jest.fn(),
      isReady: jest.fn(),
      close: jest.fn(),
    };

    mockL2 = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      flush: jest.fn(),
      keys: jest.fn(),
      isReady: jest.fn(),
      close: jest.fn(),
    };
  });

  afterEach(async () => {
    if (cache) {
      await cache.close();
    }
  });

  describe('Constructor', () => {
    it('deve criar instância com L1 e L2', () => {
      // Act
      cache = new LayeredCacheAdapter(mockL1, mockL2);

      // Assert
      expect(cache).toBeInstanceOf(LayeredCacheAdapter);
    });

    it('deve criar instância com nome customizado', () => {
      // Act
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'CustomLayered');

      // Assert
      expect(cache).toBeInstanceOf(LayeredCacheAdapter);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve retornar valor do L1 quando existe (HIT L1)', async () => {
      // Arrange
      mockL1.get.mockResolvedValue('l1-value');

      // Act
      const result = await cache.get('key');

      // Assert
      expect(mockL1.get).toHaveBeenCalledWith('key');
      expect(mockL2.get).not.toHaveBeenCalled();
      expect(result).toBe('l1-value');
    });

    it('deve retornar valor do L2 quando não está em L1 (HIT L2)', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue('l2-value');
      mockL1.set.mockResolvedValue(true);

      // Act
      const result = await cache.get('key');

      // Assert
      expect(mockL1.get).toHaveBeenCalledWith('key');
      expect(mockL2.get).toHaveBeenCalledWith('key');
      expect(result).toBe('l2-value');
    });

    it('deve promover valor de L2 para L1 após hit em L2', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue('l2-value');
      mockL1.set.mockResolvedValue(true);

      // Act
      await cache.get('key');

      // Assert
      expect(mockL1.set).toHaveBeenCalledWith('key', 'l2-value');
    });

    it('deve retornar undefined quando não existe em nenhuma camada (MISS)', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue(undefined);

      // Act
      const result = await cache.get('key');

      // Assert
      expect(mockL1.get).toHaveBeenCalledWith('key');
      expect(mockL2.get).toHaveBeenCalledWith('key');
      expect(result).toBeUndefined();
    });

    it('deve retornar diferentes tipos de dados', async () => {
      // Arrange
      mockL1.get
        .mockResolvedValueOnce('string')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockL2.get
        .mockResolvedValueOnce(123)
        .mockResolvedValueOnce({ a: 1 })
        .mockResolvedValueOnce([1, 2, 3]);

      mockL1.set.mockResolvedValue(true);

      // Act & Assert
      expect(await cache.get('string')).toBe('string');
      expect(await cache.get('number')).toBe(123);
      expect(await cache.get('object')).toEqual({ a: 1 });
      expect(await cache.get('array')).toEqual([1, 2, 3]);
    });

    it('não deve falhar quando promoção para L1 falha', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue('l2-value');
      mockL1.set.mockRejectedValue(new Error('L1 set error'));

      // Act
      const result = await cache.get('key');

      // Assert
      expect(result).toBe('l2-value');
    });

    it('deve retornar undefined em caso de erro', async () => {
      // Arrange
      mockL1.get.mockRejectedValue(new Error('L1 error'));

      // Act
      const result = await cache.get('key');

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve contabilizar L1 hits', async () => {
      // Arrange
      mockL1.get.mockResolvedValue('value');

      // Act
      await cache.get('key1');
      await cache.get('key2');

      // Assert
      const stats = cache.getStats();
      expect(stats.l1.hits).toBe(2);
      expect(stats.l1.misses).toBe(0);
      expect(stats.overall.hits).toBe(2);
    });

    it('deve contabilizar L2 hits', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue('value');
      mockL1.set.mockResolvedValue(true);

      // Act
      await cache.get('key1');
      await cache.get('key2');

      // Assert
      const stats = cache.getStats();
      expect(stats.l1.hits).toBe(0);
      expect(stats.l1.misses).toBe(2);
      expect(stats.l2.hits).toBe(2);
      expect(stats.overall.hits).toBe(2);
    });

    it('deve contabilizar misses', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue(undefined);

      // Act
      await cache.get('key1');
      await cache.get('key2');

      // Assert
      const stats = cache.getStats();
      expect(stats.l1.misses).toBe(2);
      expect(stats.l2.misses).toBe(2);
      expect(stats.overall.misses).toBe(2);
    });
  });

  describe('set', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve armazenar em ambas as camadas', async () => {
      // Arrange
      mockL1.set.mockResolvedValue(true);
      mockL2.set.mockResolvedValue(true);

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(mockL1.set).toHaveBeenCalledWith('key', 'value', undefined);
      expect(mockL2.set).toHaveBeenCalledWith('key', 'value', undefined);
      expect(result).toBe(true);
    });

    it('deve armazenar com TTL em ambas as camadas', async () => {
      // Arrange
      mockL1.set.mockResolvedValue(true);
      mockL2.set.mockResolvedValue(true);

      // Act
      const result = await cache.set('key', 'value', 600);

      // Assert
      expect(mockL1.set).toHaveBeenCalledWith('key', 'value', 600);
      expect(mockL2.set).toHaveBeenCalledWith('key', 'value', 600);
      expect(result).toBe(true);
    });

    it('deve retornar true se L1 teve sucesso mesmo se L2 falhou', async () => {
      // Arrange
      mockL1.set.mockResolvedValue(true);
      mockL2.set.mockResolvedValue(false);

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar true se L2 teve sucesso mesmo se L1 falhou', async () => {
      // Arrange
      mockL1.set.mockResolvedValue(false);
      mockL2.set.mockResolvedValue(true);

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false se ambas as camadas falharam', async () => {
      // Arrange
      mockL1.set.mockResolvedValue(false);
      mockL2.set.mockResolvedValue(false);

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });

    it('deve continuar mesmo se uma camada lançar erro', async () => {
      // Arrange
      mockL1.set.mockRejectedValue(new Error('L1 error'));
      mockL2.set.mockResolvedValue(true);

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(true);
    });

    it('deve armazenar objetos complexos', async () => {
      // Arrange
      const complexObject = {
        id: 1,
        name: 'Test',
        nested: { value: 'nested' },
      };
      mockL1.set.mockResolvedValue(true);
      mockL2.set.mockResolvedValue(true);

      // Act
      const result = await cache.set('complex', complexObject);

      // Assert
      expect(mockL1.set).toHaveBeenCalledWith('complex', complexObject, undefined);
      expect(mockL2.set).toHaveBeenCalledWith('complex', complexObject, undefined);
      expect(result).toBe(true);
    });

    it('deve retornar false em caso de erro catastrófico', async () => {
      // Arrange
      mockL1.set.mockRejectedValue(new Error('L1 error'));
      mockL2.set.mockRejectedValue(new Error('L2 error'));

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve remover de ambas as camadas', async () => {
      // Arrange
      mockL1.delete.mockResolvedValue(1);
      mockL2.delete.mockResolvedValue(1);

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(mockL1.delete).toHaveBeenCalledWith('key');
      expect(mockL2.delete).toHaveBeenCalledWith('key');
      expect(result).toBe(2);
    });

    it('deve retornar contagem de L1 quando L2 falha', async () => {
      // Arrange
      mockL1.delete.mockResolvedValue(1);
      mockL2.delete.mockResolvedValue(0);

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(1);
    });

    it('deve retornar contagem de L2 quando L1 falha', async () => {
      // Arrange
      mockL1.delete.mockResolvedValue(0);
      mockL2.delete.mockResolvedValue(1);

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(1);
    });

    it('deve retornar 0 quando nenhuma camada remove', async () => {
      // Arrange
      mockL1.delete.mockResolvedValue(0);
      mockL2.delete.mockResolvedValue(0);

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(0);
    });

    it('deve continuar mesmo se uma camada lançar erro', async () => {
      // Arrange
      mockL1.delete.mockRejectedValue(new Error('L1 error'));
      mockL2.delete.mockResolvedValue(1);

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(1);
    });

    it('deve retornar 0 em caso de erro catastrófico', async () => {
      // Arrange
      mockL1.delete.mockRejectedValue(new Error('L1 error'));
      mockL2.delete.mockRejectedValue(new Error('L2 error'));

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve limpar ambas as camadas', async () => {
      // Arrange
      mockL1.flush.mockResolvedValue(undefined);
      mockL2.flush.mockResolvedValue(undefined);

      // Act
      await cache.flush();

      // Assert
      expect(mockL1.flush).toHaveBeenCalled();
      expect(mockL2.flush).toHaveBeenCalled();
    });

    it('não deve lançar erro quando uma camada falha', async () => {
      // Arrange
      mockL1.flush.mockRejectedValue(new Error('L1 error'));
      mockL2.flush.mockResolvedValue(undefined);

      // Act & Assert
      await expect(cache.flush()).resolves.not.toThrow();
    });

    it('não deve lançar erro em caso de erro catastrófico', async () => {
      // Arrange
      mockL1.flush.mockRejectedValue(new Error('L1 error'));
      mockL2.flush.mockRejectedValue(new Error('L2 error'));

      // Act & Assert
      await expect(cache.flush()).resolves.not.toThrow();
    });
  });

  describe('keys', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve retornar união de chaves de ambas as camadas', async () => {
      // Arrange
      mockL1.keys.mockResolvedValue(['key1', 'key2']);
      mockL2.keys.mockResolvedValue(['key3', 'key4']);

      // Act
      const result = await cache.keys();

      // Assert
      expect(mockL1.keys).toHaveBeenCalledWith(undefined);
      expect(mockL2.keys).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(4);
      expect(result).toContain('key1');
      expect(result).toContain('key2');
      expect(result).toContain('key3');
      expect(result).toContain('key4');
    });

    it('deve retornar chaves com pattern', async () => {
      // Arrange
      mockL1.keys.mockResolvedValue(['user:1']);
      mockL2.keys.mockResolvedValue(['user:2']);

      // Act
      const result = await cache.keys('user:*');

      // Assert
      expect(mockL1.keys).toHaveBeenCalledWith('user:*');
      expect(mockL2.keys).toHaveBeenCalledWith('user:*');
      expect(result).toEqual(['user:1', 'user:2']);
    });

    it('deve remover duplicatas', async () => {
      // Arrange
      mockL1.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockL2.keys.mockResolvedValue(['key2', 'key3', 'key4']);

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toHaveLength(4);
      expect(result).toContain('key1');
      expect(result).toContain('key2');
      expect(result).toContain('key3');
      expect(result).toContain('key4');
    });

    it('deve retornar chaves de L1 quando L2 falha', async () => {
      // Arrange
      mockL1.keys.mockResolvedValue(['key1', 'key2']);
      mockL2.keys.mockRejectedValue(new Error('L2 error'));

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual(['key1', 'key2']);
    });

    it('deve retornar chaves de L2 quando L1 falha', async () => {
      // Arrange
      mockL1.keys.mockRejectedValue(new Error('L1 error'));
      mockL2.keys.mockResolvedValue(['key3', 'key4']);

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual(['key3', 'key4']);
    });

    it('deve retornar array vazio em caso de erro catastrófico', async () => {
      // Arrange
      mockL1.keys.mockRejectedValue(new Error('L1 error'));
      mockL2.keys.mockRejectedValue(new Error('L2 error'));

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('isReady', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve retornar true quando ambas as camadas estão prontas', async () => {
      // Arrange
      mockL1.isReady.mockResolvedValue(true);
      mockL2.isReady.mockResolvedValue(true);

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(true);
    });

    it('deve retornar true quando apenas L1 está pronto', async () => {
      // Arrange
      mockL1.isReady.mockResolvedValue(true);
      mockL2.isReady.mockResolvedValue(false);

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(true);
    });

    it('deve retornar true quando apenas L2 está pronto', async () => {
      // Arrange
      mockL1.isReady.mockResolvedValue(false);
      mockL2.isReady.mockResolvedValue(true);

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(true);
    });

    it('deve retornar false quando ambas as camadas não estão prontas', async () => {
      // Arrange
      mockL1.isReady.mockResolvedValue(false);
      mockL2.isReady.mockResolvedValue(false);

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(false);
    });

    it('deve retornar false em caso de erro', async () => {
      // Arrange
      mockL1.isReady.mockRejectedValue(new Error('L1 error'));
      mockL2.isReady.mockRejectedValue(new Error('L2 error'));

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(false);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
    });

    it('deve fechar ambas as camadas', async () => {
      // Arrange
      mockL1.close.mockResolvedValue(undefined);
      mockL2.close.mockResolvedValue(undefined);

      // Act
      await cache.close();

      // Assert
      expect(mockL1.close).toHaveBeenCalled();
      expect(mockL2.close).toHaveBeenCalled();
    });

    it('não deve lançar erro quando uma camada falha', async () => {
      // Arrange
      mockL1.close.mockRejectedValue(new Error('L1 error'));
      mockL2.close.mockResolvedValue(undefined);

      // Act & Assert
      await expect(cache.close()).resolves.not.toThrow();
    });

    it('não deve lançar erro em caso de erro catastrófico', async () => {
      // Arrange
      mockL1.close.mockRejectedValue(new Error('L1 error'));
      mockL2.close.mockRejectedValue(new Error('L2 error'));

      // Act & Assert
      await expect(cache.close()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
      mockL1.set.mockResolvedValue(true);
      mockL2.set.mockResolvedValue(true);
    });

    it('deve retornar estatísticas iniciais zeradas', () => {
      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.l1.hits).toBe(0);
      expect(stats.l1.misses).toBe(0);
      expect(stats.l1.hitRate).toBe(0);
      expect(stats.l2.hits).toBe(0);
      expect(stats.l2.misses).toBe(0);
      expect(stats.l2.hitRate).toBe(0);
      expect(stats.overall.hits).toBe(0);
      expect(stats.overall.misses).toBe(0);
      expect(stats.overall.hitRate).toBe(0);
    });

    it('deve contabilizar L1 hits corretamente', async () => {
      // Arrange
      mockL1.get.mockResolvedValue('value');

      // Act
      await cache.get('key1');
      await cache.get('key2');
      const stats = cache.getStats();

      // Assert
      expect(stats.l1.hits).toBe(2);
      expect(stats.l1.hitRate).toBe(100);
    });

    it('deve contabilizar L2 hits corretamente', async () => {
      // Arrange
      mockL1.get.mockResolvedValue(undefined);
      mockL2.get.mockResolvedValue('value');

      // Act
      await cache.get('key1');
      await cache.get('key2');
      const stats = cache.getStats();

      // Assert
      expect(stats.l1.misses).toBe(2);
      expect(stats.l2.hits).toBe(2);
      expect(stats.l2.hitRate).toBe(100);
      expect(stats.overall.hits).toBe(2);
      expect(stats.overall.hitRate).toBe(100);
    });

    it('deve calcular hit rate corretamente com hits e misses', async () => {
      // Arrange
      mockL1.get
        .mockResolvedValueOnce('value')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce('value')
        .mockResolvedValueOnce(undefined);

      mockL2.get.mockResolvedValueOnce('value').mockResolvedValueOnce(undefined);

      // Act
      await cache.get('key1'); // L1 hit
      await cache.get('key2'); // L2 hit
      await cache.get('key3'); // L1 hit
      await cache.get('key4'); // miss
      const stats = cache.getStats();

      // Assert
      expect(stats.l1.hits).toBe(2);
      expect(stats.l1.misses).toBe(2);
      expect(stats.l1.hitRate).toBe(50);
      expect(stats.l2.hits).toBe(1);
      expect(stats.l2.misses).toBe(1);
      expect(stats.l2.hitRate).toBe(50);
      expect(stats.overall.hits).toBe(3);
      expect(stats.overall.misses).toBe(1);
      expect(stats.overall.hitRate).toBe(75);
    });

    it('deve retornar 0 hitRate quando não há acessos', () => {
      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.overall.hitRate).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      cache = new LayeredCacheAdapter(mockL1, mockL2, 'TestCache');
      mockL1.set.mockResolvedValue(true);
      mockL2.set.mockResolvedValue(true);
    });

    it('deve manter integridade em operações sequenciais', async () => {
      // Arrange
      mockL1.delete.mockResolvedValue(1);
      mockL2.delete.mockResolvedValue(1);
      mockL1.get
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce('value2')
        .mockResolvedValueOnce('value3');

      // Act
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.delete('key1');
      await cache.set('key3', 'value3');

      // Assert
      expect(await cache.get('key2')).toBe('value2');
      expect(await cache.get('key3')).toBe('value3');
    });

    it('deve funcionar com operações concorrentes', async () => {
      // Arrange
      const operations = [];

      // Act
      for (let i = 0; i < 10; i++) {
        operations.push(cache.set(`key${i}`, `value${i}`, 300));
      }
      await Promise.all(operations);

      // Assert
      expect(mockL1.set).toHaveBeenCalledTimes(10);
      expect(mockL2.set).toHaveBeenCalledTimes(10);
    });

    it('deve promover dados de L2 para L1 e servir de L1 na próxima requisição', async () => {
      // Arrange
      mockL1.get.mockResolvedValueOnce(undefined).mockResolvedValueOnce('l2-value');
      mockL2.get.mockResolvedValueOnce('l2-value');

      // Act
      const result1 = await cache.get('key'); // L2 hit + promotion
      const result2 = await cache.get('key'); // L1 hit

      // Assert
      expect(result1).toBe('l2-value');
      expect(result2).toBe('l2-value');
      expect(mockL1.set).toHaveBeenCalledWith('key', 'l2-value');

      const stats = cache.getStats();
      expect(stats.l1.hits).toBe(1);
      expect(stats.l2.hits).toBe(1);
      expect(stats.overall.hits).toBe(2);
    });
  });
});
