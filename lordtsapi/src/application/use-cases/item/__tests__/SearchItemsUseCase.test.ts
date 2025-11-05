// src/application/use-cases/item/__tests__/SearchItemsUseCase.test.ts

import { SearchItemsUseCase, type SearchItemsRequest } from '../SearchItemsUseCase';
import type { IItemRepository } from '@application/interfaces/repositories';
import type { ILogger, ICache } from '@application/interfaces/infrastructure';
import { Item } from '@domain/entities';

describe('SearchItemsUseCase', () => {
  let useCase: SearchItemsUseCase;
  let mockRepository: jest.Mocked<IItemRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCache: jest.Mocked<ICache>;

  beforeEach(() => {
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

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn(),
    };

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

    useCase = new SearchItemsUseCase(mockRepository, mockLogger, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Happy Path', () => {
      it('deve retornar resultados paginados para busca geral', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'torneira',
          page: 1,
          limit: 20,
        };

        const mockItems = [
          Item.create({ codigo: '001', descricao: 'TORNEIRA A', unidade: 'UN' }),
          Item.create({ codigo: '002', descricao: 'TORNEIRA B', unidade: 'UN' }),
        ];

        const mockResult = {
          data: mockItems,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue(mockResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.data).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(mockRepository.search).toHaveBeenCalledWith(
          'torneira',
          expect.objectContaining({ page: 1, limit: 20 })
        );
      });

      it('deve buscar por GTIN quando fornecido', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          gtin: '7891234567890',
        };

        const mockItem = Item.create({
          codigo: '001',
          descricao: 'ITEM COM GTIN',
          unidade: 'UN',
        });

        mockCache.get.mockResolvedValue(null);
        mockRepository.findByGtin.mockResolvedValue(mockItem);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.data).toHaveLength(1);
        expect(mockRepository.findByGtin).toHaveBeenCalledWith('7891234567890');
      });

      it('deve buscar por família quando fornecida', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          familia: 'FM001',
          page: 1,
          limit: 10,
        };

        const mockResult = {
          data: [Item.create({ codigo: '001', descricao: 'ITEM', unidade: 'UN' })],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.findByFamilia.mockResolvedValue(mockResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(mockRepository.findByFamilia).toHaveBeenCalledWith(
          'FM001',
          expect.objectContaining({ page: 1, limit: 10 })
        );
      });

      it('deve buscar por grupo de estoque quando fornecido', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          grupoEstoque: '01',
          page: 1,
          limit: 10,
        };

        const mockResult = {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.findByGrupoEstoque.mockResolvedValue(mockResult);

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRepository.findByGrupoEstoque).toHaveBeenCalledWith(
          '01',
          expect.any(Object)
        );
      });
    });

    describe('Validação de Entrada', () => {
      it('deve lançar erro quando page é menor que 1', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
          page: 0,
        };

        // Act & Assert
        await expect(useCase.execute(request)).rejects.toThrow(
          'Página deve ser maior que zero'
        );
      });

      it('deve lançar erro quando limit é menor que 1', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
          limit: 0,
        };

        // Act & Assert
        await expect(useCase.execute(request)).rejects.toThrow(
          'Limite deve estar entre 1 e 100'
        );
      });

      it('deve lançar erro quando limit é maior que 100', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
          limit: 101,
        };

        // Act & Assert
        await expect(useCase.execute(request)).rejects.toThrow(
          'Limite deve estar entre 1 e 100'
        );
      });

      it('deve lançar erro quando GTIN é inválido', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          gtin: 'ABC123', // Não numérico
        };

        // Act & Assert
        await expect(useCase.execute(request)).rejects.toThrow(
          'GTIN deve ter 13 ou 14 dígitos numéricos'
        );
      });

      it('deve lançar erro quando GTIN tem tamanho incorreto', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          gtin: '12345', // Menos de 13 dígitos
        };

        // Act & Assert
        await expect(useCase.execute(request)).rejects.toThrow(
          'GTIN deve ter 13 ou 14 dígitos numéricos'
        );
      });
    });

    describe('Cache Behavior', () => {
      it('deve retornar do cache quando disponível', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
        };

        const cachedResult = {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(cachedResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toEqual(cachedResult);
        expect(mockRepository.search).not.toHaveBeenCalled();
      });

      it('deve salvar no cache após busca', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
        };

        const mockResult = {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue(mockResult);

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockCache.set).toHaveBeenCalledWith(
          expect.stringContaining('items:search'),
          expect.any(Object),
          120
        );
      });

      it('deve gerar cache key com todos os parâmetros', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'torneira',
          familia: 'FM001',
          ativo: true,
          page: 2,
          limit: 50,
        };

        const mockResult = {
          data: [],
          pagination: {
            page: 2,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue(mockResult);

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockCache.get).toHaveBeenCalledWith(
          expect.stringContaining('q:torneira')
        );
        expect(mockCache.get).toHaveBeenCalledWith(
          expect.stringContaining('fam:FM001')
        );
        expect(mockCache.get).toHaveBeenCalledWith(
          expect.stringContaining('ativo:true')
        );
      });
    });

    describe('Logging', () => {
      it('deve logar início da busca', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
          page: 1,
          limit: 10,
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue({
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'SearchItemsUseCase: Searching items',
          expect.objectContaining({ search: 'test' })
        );
      });

      it('deve logar conclusão da busca', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue({
          data: [Item.create({ codigo: '001', descricao: 'TEST', unidade: 'UN' })],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'SearchItemsUseCase: Search completed',
          expect.objectContaining({ total: 1, page: 1 })
        );
      });
    });

    describe('Edge Cases', () => {
      it('deve retornar resultado vazio quando nenhum item encontrado', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'inexistente',
        };

        const mockResult = {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue(mockResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });

      it('deve retornar vazio quando GTIN não encontrado', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          gtin: '1234567890123',
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.findByGtin.mockResolvedValue(null);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });

      it('deve usar valores padrão quando page/limit não fornecidos', async () => {
        // Arrange
        const request: SearchItemsRequest = {
          search: 'test',
          // Sem page e limit
        };

        mockCache.get.mockResolvedValue(null);
        mockRepository.search.mockResolvedValue({
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRepository.search).toHaveBeenCalledWith(
          'test',
          expect.objectContaining({
            page: 1,
            limit: 20,
          })
        );
      });
    });
  });
});
