// src/application/use-cases/item/__tests__/GetItemUseCase.test.ts

import { GetItemUseCase } from '../GetItemUseCase';
import type { IItemRepository } from '@application/interfaces/repositories';
import type { ILogger, ICache } from '@application/interfaces/infrastructure';
import { Item } from '@domain/entities';

/**
 * Testes Unitários - GetItemUseCase
 *
 * Cobertura:
 * - ✅ Happy path
 * - ✅ Validação de entrada
 * - ✅ Cache hit
 * - ✅ Cache miss
 * - ✅ Item não encontrado
 * - ✅ Erros de repositório
 */
describe('GetItemUseCase', () => {
  let useCase: GetItemUseCase;
  let mockRepository: jest.Mocked<IItemRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCache: jest.Mocked<ICache>;

  beforeEach(() => {
    // Mock do repositório
    mockRepository = {
      findByCodigo: jest.fn(),
      findCompleto: jest.fn(),
      findManyCodigos: jest.fn(),
      findByFamilia: jest.fn(),
      findByGrupoEstoque: jest.fn(),
      findByGtin: jest.fn(),
      search: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    };

    // Mock do logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn(),
    };

    // Mock do cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delMany: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      getOrSet: jest.fn(),
      invalidatePattern: jest.fn(),
      getStats: jest.fn(),
    };

    useCase = new GetItemUseCase(mockRepository, mockLogger, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Happy Path', () => {
      it('deve retornar item completo quando encontrado', async () => {
        // Arrange
        const itemCodigo = '7530110';
        const mockItem = Item.create({
          codigo: itemCodigo,
          descricao: 'TORNEIRA MONOCOMANDO',
          unidade: 'UN',
          ativo: true,
        });

        const mockItemCompleto = {
          item: mockItem,
          familia: {
            codigo: 'FM001',
            descricao: 'METAIS',
          },
          grupoEstoque: {
            codigo: '01',
            descricao: 'MATERIAIS',
          },
        };

        mockCache.get.mockResolvedValue(null); // Cache miss
        mockRepository.findCompleto.mockResolvedValue(mockItemCompleto);

        // Act
        const result = await useCase.execute(itemCodigo);

        // Assert
        expect(result).toBeDefined();
        expect(result.codigo).toBe(itemCodigo);
        expect(result.descricao).toBe('TORNEIRA MONOCOMANDO');
        expect(mockRepository.findCompleto).toHaveBeenCalledWith(itemCodigo);
        expect(mockCache.set).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
          'GetItemUseCase: Item fetched successfully',
          { itemCodigo }
        );
      });

      it('deve retornar item do cache quando disponível', async () => {
        // Arrange
        const itemCodigo = '7530110';
        const cachedItem = {
          codigo: itemCodigo,
          descricao: 'TORNEIRA MONOCOMANDO (CACHED)',
          unidade: 'UN',
          ativo: true,
        };

        mockCache.get.mockResolvedValue(cachedItem);

        // Act
        const result = await useCase.execute(itemCodigo);

        // Assert
        expect(result).toEqual(cachedItem);
        expect(mockRepository.findCompleto).not.toHaveBeenCalled();
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'GetItemUseCase: Cache hit',
          { itemCodigo }
        );
      });
    });

    describe('Validação de Entrada', () => {
      it('deve lançar erro quando código é vazio', async () => {
        // Arrange
        const itemCodigo = '';

        // Act & Assert
        await expect(useCase.execute(itemCodigo)).rejects.toThrow(
          'Código do item é obrigatório'
        );
        expect(mockRepository.findCompleto).not.toHaveBeenCalled();
      });

      it('deve lançar erro quando código é apenas espaços', async () => {
        // Arrange
        const itemCodigo = '   ';

        // Act & Assert
        await expect(useCase.execute(itemCodigo)).rejects.toThrow(
          'Código do item é obrigatório'
        );
      });

      it('deve lançar erro quando código é muito longo', async () => {
        // Arrange
        const itemCodigo = '12345678901234567'; // 17 caracteres

        // Act & Assert
        await expect(useCase.execute(itemCodigo)).rejects.toThrow(
          'Código do item deve ter no máximo 16 caracteres'
        );
      });
    });

    describe('Item Não Encontrado', () => {
      it('deve lançar erro quando item não existe', async () => {
        // Arrange
        const itemCodigo = 'INEXISTENTE';
        mockCache.get.mockResolvedValue(null);
        mockRepository.findCompleto.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(itemCodigo)).rejects.toThrow(
          `Item não encontrado: ${itemCodigo}`
        );
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'GetItemUseCase: Item not found',
          { itemCodigo }
        );
      });
    });

    describe('Cache Behavior', () => {
      it('deve salvar resultado no cache após buscar do repositório', async () => {
        // Arrange
        const itemCodigo = '7530110';
        const mockItem = Item.create({
          codigo: itemCodigo,
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        mockCache.get.mockResolvedValue(null);
        mockRepository.findCompleto.mockResolvedValue({
          item: mockItem,
        });

        // Act
        await useCase.execute(itemCodigo);

        // Assert
        expect(mockCache.set).toHaveBeenCalledWith(
          `item:completo:${itemCodigo}`,
          expect.any(Object),
          300
        );
      });

      it('deve usar cache key correto', async () => {
        // Arrange
        const itemCodigo = 'ABC123';
        mockCache.get.mockResolvedValue(null);
        mockRepository.findCompleto.mockResolvedValue({
          item: Item.create({
            codigo: itemCodigo,
            descricao: 'TEST',
            unidade: 'UN',
          }),
        });

        // Act
        await useCase.execute(itemCodigo);

        // Assert
        expect(mockCache.get).toHaveBeenCalledWith(`item:completo:${itemCodigo}`);
      });
    });

    describe('Logging', () => {
      it('deve logar início da operação', async () => {
        // Arrange
        const itemCodigo = '7530110';
        mockCache.get.mockResolvedValue(null);
        mockRepository.findCompleto.mockResolvedValue({
          item: Item.create({ codigo: itemCodigo, descricao: 'TEST', unidade: 'UN' }),
        });

        // Act
        await useCase.execute(itemCodigo);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'GetItemUseCase: Fetching item',
          { itemCodigo }
        );
      });

      it('deve logar cache miss', async () => {
        // Arrange
        const itemCodigo = '7530110';
        mockCache.get.mockResolvedValue(null);
        mockRepository.findCompleto.mockResolvedValue({
          item: Item.create({ codigo: itemCodigo, descricao: 'TEST', unidade: 'UN' }),
        });

        // Act
        await useCase.execute(itemCodigo);

        // Assert
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'GetItemUseCase: Cache miss',
          { itemCodigo }
        );
      });
    });

    describe('Erros de Repositório', () => {
      it('deve propagar erro do repositório', async () => {
        // Arrange
        const itemCodigo = '7530110';
        const repositoryError = new Error('Database connection failed');

        mockCache.get.mockResolvedValue(null);
        mockRepository.findCompleto.mockRejectedValue(repositoryError);

        // Act & Assert
        await expect(useCase.execute(itemCodigo)).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('deve propagar erro do cache', async () => {
        // Arrange
        const itemCodigo = '7530110';
        const cacheError = new Error('Redis connection failed');

        mockCache.get.mockRejectedValue(cacheError);

        // Act & Assert
        await expect(useCase.execute(itemCodigo)).rejects.toThrow(
          'Redis connection failed'
        );
      });
    });
  });
});
