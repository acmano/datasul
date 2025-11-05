// tests/integration/cache/RedisCache.integration.test.ts

/**
 * Testes de Integração - Redis Cache
 *
 * Requer Redis rodando em localhost:6379 ou configurado em .env.test
 * Execute: npm run test:integration -- redis
 *
 * @group integration
 * @group cache
 */

import { CacheManager } from '@shared/utils/cacheManager';

describe('Redis Cache - Integration Tests', () => {
  beforeAll(async () => {
    // Aguardar conexão com Redis
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterEach(async () => {
    // Limpar cache após cada teste
    await CacheManager.clear();
  });

  afterAll(async () => {
    // Fechar conexões
    await CacheManager.clear();
  });

  describe('Basic Operations', () => {
    it('deve salvar e recuperar valor do Redis', async () => {
      // Arrange
      const key = 'test:key:1';
      const value = { data: 'test value', timestamp: Date.now() };

      // Act
      await CacheManager.set(key, value, 60);
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('deve retornar null para chave inexistente', async () => {
      // Arrange
      const key = 'test:nonexistent';

      // Act
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toBeNull();
    });

    it('deve deletar chave existente', async () => {
      // Arrange
      const key = 'test:delete:1';
      await CacheManager.set(key, 'value', 60);

      // Act
      await CacheManager.del(key);
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toBeNull();
    });

    it('deve verificar existência de chave', async () => {
      // Arrange
      const key = 'test:exists:1';
      await CacheManager.set(key, 'value', 60);

      // Act
      const exists = await CacheManager.has(key);
      const notExists = await CacheManager.has('test:not:exists');

      // Assert
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('deve expirar chave após TTL', async () => {
      // Arrange
      const key = 'test:ttl:1';
      const ttl = 2; // 2 segundos

      // Act
      await CacheManager.set(key, 'value', ttl);
      const beforeExpire = await CacheManager.get(key);

      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 2500));

      const afterExpire = await CacheManager.get(key);

      // Assert
      expect(beforeExpire).toBe('value');
      expect(afterExpire).toBeNull();
    }, 4000);

    it('deve manter valor dentro do TTL', async () => {
      // Arrange
      const key = 'test:ttl:2';
      const ttl = 5;

      // Act
      await CacheManager.set(key, 'value', ttl);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toBe('value');
    }, 3000);
  });

  describe('Complex Data Types', () => {
    it('deve cachear objetos complexos', async () => {
      // Arrange
      const key = 'test:complex:1';
      const complexData = {
        id: 123,
        name: 'Test Item',
        nested: {
          level1: {
            level2: 'deep value'
          }
        },
        array: [1, 2, 3, 4, 5],
        date: new Date().toISOString()
      };

      // Act
      await CacheManager.set(key, complexData, 60);
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toEqual(complexData);
    });

    it('deve cachear arrays', async () => {
      // Arrange
      const key = 'test:array:1';
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      // Act
      await CacheManager.set(key, arrayData, 60);
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toEqual(arrayData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });
  });

  describe('Pattern Operations', () => {
    it('deve invalidar múltiplas chaves por pattern', async () => {
      // Arrange
      await CacheManager.set('item:1', 'value1', 60);
      await CacheManager.set('item:2', 'value2', 60);
      await CacheManager.set('item:3', 'value3', 60);
      await CacheManager.set('user:1', 'user1', 60);

      // Act
      await CacheManager.invalidatePattern('item:*');

      // Assert
      const item1 = await CacheManager.get('item:1');
      const item2 = await CacheManager.get('item:2');
      const user1 = await CacheManager.get('user:1');

      expect(item1).toBeNull();
      expect(item2).toBeNull();
      expect(user1).toBe('user1'); // Não deve ser afetado
    });

    it('deve deletar múltiplas chaves', async () => {
      // Arrange
      const keys = ['multi:1', 'multi:2', 'multi:3'];
      for (const key of keys) {
        await CacheManager.set(key, `value-${key}`, 60);
      }

      // Act
      await CacheManager.delMany(keys);

      // Assert
      for (const key of keys) {
        const result = await CacheManager.get(key);
        expect(result).toBeNull();
      }
    });
  });

  describe('getOrSet Pattern', () => {
    it('deve executar factory e cachear resultado', async () => {
      // Arrange
      const key = 'test:getOrSet:1';
      let factoryCalls = 0;
      const factory = async () => {
        factoryCalls++;
        return { data: 'factory result', timestamp: Date.now() };
      };

      // Act
      const result1 = await CacheManager.getOrSet(key, factory, 60);
      const result2 = await CacheManager.getOrSet(key, factory, 60);

      // Assert
      expect(factoryCalls).toBe(1); // Factory só deve ser chamado uma vez
      expect(result1).toEqual(result2);
    });

    it('deve chamar factory novamente após cache expirar', async () => {
      // Arrange
      const key = 'test:getOrSet:2';
      let factoryCalls = 0;
      const factory = async () => {
        factoryCalls++;
        return `result-${factoryCalls}`;
      };

      // Act
      const result1 = await CacheManager.getOrSet(key, factory, 1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result2 = await CacheManager.getOrSet(key, factory, 1);

      // Assert
      expect(factoryCalls).toBe(2);
      expect(result1).toBe('result-1');
      expect(result2).toBe('result-2');
    }, 3000);
  });

  describe('Cache Statistics', () => {
    it('deve retornar estatísticas de cache', async () => {
      // Arrange
      await CacheManager.set('stats:1', 'value1', 60);
      await CacheManager.get('stats:1'); // Hit
      await CacheManager.get('stats:nonexistent'); // Miss

      // Act
      const stats = await CacheManager.getStats();

      // Assert
      expect(stats).toBeDefined();
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.keys).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com valores undefined', async () => {
      // Arrange
      const key = 'test:undefined';

      // Act & Assert
      await expect(CacheManager.set(key, undefined, 60)).resolves.not.toThrow();
    });

    it('deve lidar com valores null', async () => {
      // Arrange
      const key = 'test:null';

      // Act
      await CacheManager.set(key, null, 60);
      const result = await CacheManager.get(key);

      // Assert - null pode ser um valor válido
      expect(result).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('deve lidar com operações concorrentes', async () => {
      // Arrange
      const promises = [];
      const numOperations = 10;

      // Act
      for (let i = 0; i < numOperations; i++) {
        promises.push(
          CacheManager.set(`concurrent:${i}`, `value${i}`, 60)
        );
      }

      await Promise.all(promises);

      // Assert
      for (let i = 0; i < numOperations; i++) {
        const result = await CacheManager.get(`concurrent:${i}`);
        expect(result).toBe(`value${i}`);
      }
    });
  });

  describe('Large Data', () => {
    it('deve cachear dados grandes (1MB+)', async () => {
      // Arrange
      const key = 'test:large';
      const largeData = {
        items: Array(10000).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100)
        }))
      };

      // Act
      await CacheManager.set(key, largeData, 60);
      const result = await CacheManager.get(key);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(10000);
    }, 5000);
  });
});
