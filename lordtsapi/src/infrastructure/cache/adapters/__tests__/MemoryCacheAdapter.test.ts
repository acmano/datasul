// src/infrastructure/cache/adapters/__tests__/MemoryCacheAdapter.test.ts

import { MemoryCacheAdapter } from '../MemoryCacheAdapter';

// Mock do logger para evitar logs durante testes
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

describe('MemoryCacheAdapter', () => {
  let cache: MemoryCacheAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (cache) {
      await cache.close();
    }
  });

  describe('Constructor', () => {
    it('deve criar instância com configuração padrão', () => {
      // Act
      cache = new MemoryCacheAdapter();

      // Assert
      expect(cache).toBeInstanceOf(MemoryCacheAdapter);
    });

    it('deve criar instância com TTL customizado', () => {
      // Act
      cache = new MemoryCacheAdapter(600, 'TestCache');

      // Assert
      expect(cache).toBeInstanceOf(MemoryCacheAdapter);
    });

    it('deve criar instância com nome customizado', () => {
      // Act
      cache = new MemoryCacheAdapter(300, 'CustomCache');

      // Assert
      expect(cache).toBeInstanceOf(MemoryCacheAdapter);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve retornar undefined para chave inexistente', async () => {
      // Act
      const result = await cache.get('nonexistent');

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve retornar valor armazenado', async () => {
      // Arrange
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };
      await cache.set(key, value);

      // Act
      const result = await cache.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('deve retornar undefined para chave expirada', async () => {
      // Arrange
      cache = new MemoryCacheAdapter(1, 'TestCache'); // 1 segundo TTL
      const key = 'expires-key';
      await cache.set(key, 'value');

      // Act - esperar expiração
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const result = await cache.get(key);

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve retornar diferentes tipos de dados', async () => {
      // Arrange
      const stringKey = 'string';
      const numberKey = 'number';
      const objectKey = 'object';
      const arrayKey = 'array';
      const booleanKey = 'boolean';

      await cache.set(stringKey, 'test');
      await cache.set(numberKey, 123);
      await cache.set(objectKey, { a: 1 });
      await cache.set(arrayKey, [1, 2, 3]);
      await cache.set(booleanKey, true);

      // Act & Assert
      expect(await cache.get(stringKey)).toBe('test');
      expect(await cache.get(numberKey)).toBe(123);
      expect(await cache.get(objectKey)).toEqual({ a: 1 });
      expect(await cache.get(arrayKey)).toEqual([1, 2, 3]);
      expect(await cache.get(booleanKey)).toBe(true);
    });

    it('deve retornar undefined em caso de erro', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();
      await cache.close(); // Fechar cache para causar erro

      // Act
      const result = await cache.get('key');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve armazenar valor com sucesso', async () => {
      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(true);
      expect(await cache.get('key')).toBe('value');
    });

    it('deve armazenar valor com TTL customizado', async () => {
      // Act
      const result = await cache.set('key', 'value', 600);

      // Assert
      expect(result).toBe(true);
      expect(await cache.get('key')).toBe('value');
    });

    it('deve sobrescrever valor existente', async () => {
      // Arrange
      await cache.set('key', 'old-value');

      // Act
      const result = await cache.set('key', 'new-value');

      // Assert
      expect(result).toBe(true);
      expect(await cache.get('key')).toBe('new-value');
    });

    it('deve armazenar múltiplos valores', async () => {
      // Act
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Assert
      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('value2');
      expect(await cache.get('key3')).toBe('value3');
    });

    it('deve armazenar objetos complexos', async () => {
      // Arrange
      const complexObject = {
        id: 1,
        name: 'Test',
        nested: {
          value: 'nested',
          array: [1, 2, 3],
        },
      };

      // Act
      const result = await cache.set('complex', complexObject);

      // Assert
      expect(result).toBe(true);
      expect(await cache.get('complex')).toEqual(complexObject);
    });

    it('deve retornar false em caso de erro', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();
      await cache.close(); // Fechar cache para causar erro

      // Act
      const result = await cache.set('key', 'value');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve remover chave existente', async () => {
      // Arrange
      await cache.set('key', 'value');

      // Act
      const deleted = await cache.delete('key');

      // Assert
      expect(deleted).toBe(1);
      expect(await cache.get('key')).toBeUndefined();
    });

    it('deve retornar 0 para chave inexistente', async () => {
      // Act
      const deleted = await cache.delete('nonexistent');

      // Assert
      expect(deleted).toBe(0);
    });

    it('deve remover múltiplas chaves', async () => {
      // Arrange
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      // Act
      const deleted1 = await cache.delete('key1');
      const deleted2 = await cache.delete('key2');

      // Assert
      expect(deleted1).toBe(1);
      expect(deleted2).toBe(1);
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.get('key2')).toBeUndefined();
    });

    it('deve retornar 0 em caso de erro', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();
      await cache.close(); // Fechar cache para causar erro

      // Act
      const result = await cache.delete('key');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve limpar todo o cache', async () => {
      // Arrange
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Act
      await cache.flush();

      // Assert
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.get('key2')).toBeUndefined();
      expect(await cache.get('key3')).toBeUndefined();
    });

    it('deve funcionar com cache vazio', async () => {
      // Act & Assert
      await expect(cache.flush()).resolves.not.toThrow();
    });

    it('não deve lançar erro mesmo em caso de falha', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();
      await cache.close(); // Fechar cache para causar erro

      // Act & Assert
      await expect(cache.flush()).resolves.not.toThrow();
    });
  });

  describe('keys', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve retornar todas as chaves', async () => {
      // Arrange
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Act
      const keys = await cache.keys();

      // Assert
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('deve retornar array vazio quando não há chaves', async () => {
      // Act
      const keys = await cache.keys();

      // Assert
      expect(keys).toEqual([]);
    });

    it('deve filtrar chaves por padrão simples', async () => {
      // Arrange
      await cache.set('user:1', 'value1');
      await cache.set('user:2', 'value2');
      await cache.set('item:1', 'value3');

      // Act
      const keys = await cache.keys('user:*');

      // Assert
      expect(keys).toHaveLength(2);
      expect(keys).toContain('user:1');
      expect(keys).toContain('user:2');
    });

    it('deve filtrar chaves por padrão com wildcard no meio', async () => {
      // Arrange
      await cache.set('item:123:info', 'value1');
      await cache.set('item:456:info', 'value2');
      await cache.set('item:789:details', 'value3');

      // Act
      const keys = await cache.keys('item:*:info');

      // Assert
      expect(keys).toHaveLength(2);
      expect(keys).toContain('item:123:info');
      expect(keys).toContain('item:456:info');
    });

    it('deve retornar array vazio quando padrão não encontra chaves', async () => {
      // Arrange
      await cache.set('key1', 'value1');

      // Act
      const keys = await cache.keys('nomatch:*');

      // Assert
      expect(keys).toEqual([]);
    });

    it('deve retornar array vazio em caso de erro', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();
      await cache.close(); // Fechar cache para causar erro

      // Act
      const result = await cache.keys();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('isReady', () => {
    it('deve sempre retornar true', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(true);
    });

    it('deve retornar true mesmo após close', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();
      await cache.close();

      // Act
      const ready = await cache.isReady();

      // Assert
      expect(ready).toBe(true);
    });
  });

  describe('close', () => {
    it('deve fechar cache sem erros', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();

      // Act & Assert
      await expect(cache.close()).resolves.not.toThrow();
    });

    it('deve permitir múltiplas chamadas', async () => {
      // Arrange
      cache = new MemoryCacheAdapter();

      // Act & Assert
      await expect(cache.close()).resolves.not.toThrow();
      await expect(cache.close()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve retornar estatísticas iniciais', () => {
      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hitRate');
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.keys).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('deve contabilizar hits', async () => {
      // Arrange
      await cache.set('key', 'value');

      // Act
      await cache.get('key'); // Hit
      await cache.get('key'); // Hit
      const stats = cache.getStats();

      // Assert
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(100);
    });

    it('deve contabilizar misses', async () => {
      // Act
      await cache.get('nonexistent'); // Miss
      await cache.get('nonexistent'); // Miss
      const stats = cache.getStats();

      // Assert
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0);
    });

    it('deve calcular hitRate corretamente', async () => {
      // Arrange
      await cache.set('key', 'value');

      // Act
      await cache.get('key'); // Hit
      await cache.get('nonexistent'); // Miss
      await cache.get('key'); // Hit
      await cache.get('nonexistent'); // Miss
      const stats = cache.getStats();

      // Assert
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(50); // 2/(2+2) = 0.5 = 50%
    });

    it('deve contabilizar número de chaves', async () => {
      // Arrange
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.keys).toBe(3);
    });

    it('deve atualizar contagem de chaves após delete', async () => {
      // Arrange
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.delete('key1');

      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.keys).toBe(1);
    });

    it('deve zerar contagem após flush', async () => {
      // Arrange
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.flush();

      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.keys).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      cache = new MemoryCacheAdapter(300, 'TestCache');
    });

    it('deve manter dados após múltiplas operações', async () => {
      // Arrange & Act
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.delete('key1');
      await cache.set('key3', 'value3');

      // Assert
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.get('key2')).toBe('value2');
      expect(await cache.get('key3')).toBe('value3');
    });

    it('deve funcionar com operações concorrentes', async () => {
      // Arrange
      const operations = [];

      // Act
      for (let i = 0; i < 100; i++) {
        operations.push(cache.set(`key${i}`, `value${i}`));
      }
      await Promise.all(operations);

      // Assert
      const keys = await cache.keys();
      expect(keys).toHaveLength(100);
    });

    it('deve manter integridade após flush parcial', async () => {
      // Arrange
      await cache.set('keep:1', 'value1');
      await cache.set('delete:1', 'value2');
      await cache.set('keep:2', 'value3');

      // Act
      const deleteKeys = await cache.keys('delete:*');
      for (const key of deleteKeys) {
        await cache.delete(key);
      }

      // Assert
      expect(await cache.get('keep:1')).toBe('value1');
      expect(await cache.get('keep:2')).toBe('value3');
      expect(await cache.get('delete:1')).toBeUndefined();
    });
  });
});
