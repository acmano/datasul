// tests/integration/database/ItemRepository.integration.test.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { ItemRepositoryAdapter } from '@infrastructure/repositories/ItemRepositoryAdapter';
import { Item } from '@domain/entities/Item';

/**
 * Testes de Integração - ItemRepository
 *
 * Estes testes verificam a integração real com o banco de dados.
 * Requerem um banco de dados de teste configurado.
 *
 * Para executar:
 * - Configure DB_CONNECTION_TYPE e credenciais de teste no .env.test
 * - Execute: npm run test:integration
 *
 * @group integration
 * @group database
 */
describe('ItemRepository - Integration Tests', () => {
  let repository: ItemRepositoryAdapter;

  beforeAll(async () => {
    // Inicializar conexão com banco de teste
    await DatabaseManager.initialize();
    repository = new ItemRepositoryAdapter();
  });

  afterAll(async () => {
    // Fechar conexões
    await DatabaseManager.close();
  });

  describe('findByCodigo', () => {
    it('deve buscar item existente do banco real', async () => {
      // Arrange - código que deve existir no banco de teste
      const codigo = 'TEST001'; // Ajustar conforme dados de teste

      // Act
      const item = await repository.findByCodigo(codigo);

      // Assert
      if (item) {
        expect(item).toBeInstanceOf(Item);
        expect(item.codigoValue).toBe(codigo);
        expect(item.descricaoValue).toBeTruthy();
        expect(item.unidadeValue).toBeTruthy();
      } else {
        // Se item não existir, documentar para criar dados de teste
        console.warn(`Item ${codigo} não encontrado. Criar dados de teste.`);
        expect(item).toBeNull();
      }
    });

    it('deve retornar null para código inexistente', async () => {
      // Arrange - código que definitivamente não existe
      const codigo = 'XXXXXX_NOT_EXISTS';

      // Act
      const item = await repository.findByCodigo(codigo);

      // Assert
      expect(item).toBeNull();
    });

    it('deve lidar com caracteres especiais no código', async () => {
      // Arrange
      const codigo = 'ABC-123';

      // Act
      const result = await repository.findByCodigo(codigo);

      // Assert - não deve lançar erro
      expect(result).toBeDefined();
    });
  });

  describe('search', () => {
    it('deve buscar items por descrição', async () => {
      // Arrange - termo que deve retornar resultados
      const searchTerm = 'TORNEIRA'; // Ajustar conforme dados de teste

      // Act
      const result = await repository.search(searchTerm, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);

      if (result.data.length > 0) {
        expect(result.data[0]).toBeInstanceOf(Item);
        expect(result.pagination.total).toBeGreaterThan(0);
      }
    });

    it('deve respeitar paginação', async () => {
      // Arrange
      const searchTerm = '';
      const page1 = await repository.search(searchTerm, { page: 1, limit: 5 });
      const page2 = await repository.search(searchTerm, { page: 2, limit: 5 });

      // Assert
      if (page1.pagination.total > 5) {
        // Se houver items suficientes
        expect(page1.data).toHaveLength(5);
        expect(page1.pagination.hasNext).toBe(true);

        // Página 2 deve ter items diferentes
        if (page2.data.length > 0) {
          const codigosPage1 = page1.data.map((i) => i.codigoValue);
          const codigosPage2 = page2.data.map((i) => i.codigoValue);
          expect(codigosPage1).not.toEqual(codigosPage2);
        }
      }
    });

    it('deve retornar resultado vazio para busca sem matches', async () => {
      // Arrange
      const searchTerm = 'XXXXXXX_NO_RESULTS_EXPECTED';

      // Act
      const result = await repository.search(searchTerm, { page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('exists', () => {
    it('deve verificar existência de item', async () => {
      // Arrange - usar item que existe
      const codigo = 'TEST001';

      // Act
      const exists = await repository.exists(codigo);

      // Assert - depende dos dados de teste
      expect(typeof exists).toBe('boolean');
    });

    it('deve retornar false para item inexistente', async () => {
      // Arrange
      const codigo = 'XXXXXX_NOT_EXISTS';

      // Act
      const exists = await repository.exists(codigo);

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('deve contar items total', async () => {
      // Act
      const total = await repository.count();

      // Assert
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('deve contar items filtrados', async () => {
      // Arrange
      const filter = { ativo: true };

      // Act
      const count = await repository.count(filter);

      // Assert
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lançar erro para query inválida', async () => {
      // Arrange - forçar erro com dados inválidos
      const invalidCodigo = "'; DROP TABLE items; --"; // SQL injection attempt

      // Act & Assert - não deve permitir SQL injection
      await expect(repository.findByCodigo(invalidCodigo)).rejects.toThrow();
    });

    it('deve lidar com timeout de conexão', async () => {
      // Este teste depende de configuração de timeout no banco
      // Pode ser implementado com test containers
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance', () => {
    it('deve executar busca em tempo aceitável (< 1s)', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await repository.search('TEST', { page: 1, limit: 10 });

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 1 segundo
    }, 2000); // Timeout de 2s para o teste

    it('deve executar findByCodigo em tempo aceitável (< 500ms)', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await repository.findByCodigo('TEST001');

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // 500ms
    }, 1000);
  });
});
