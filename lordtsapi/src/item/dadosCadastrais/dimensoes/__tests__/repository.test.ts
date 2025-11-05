// src/item/dadosCadastrais/dimensoes/__tests__/repository.test.ts

import { ItemDimensoesRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import {
  createDimensoesQueryResult,
  createDimensoesVazias,
} from '@tests/factories/dimensoes.factory';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - ItemDimensoesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // getDimensoes
  // ========================================
  describe('getDimensoes', () => {
    it('deve retornar dimensões do item quando encontrado', async () => {
      const mockResult = [createDimensoesQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemDimensoesRepository.getDimensoes('7530110');

      expect(result).toEqual(mockResult[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });

    it('deve retornar null quando item não encontrado', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await ItemDimensoesRepository.getDimensoes('INEXISTENTE');

      expect(result).toBeNull();
    });

    it('deve usar queries parametrizadas (proteção SQL Injection)', async () => {
      const maliciousCode = "'; DROP TABLE item;--";

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemDimensoesRepository.getDimensoes(maliciousCode);

      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'paramItemCodigo',
            value: maliciousCode,
          }),
        ])
      );
    });

    it('deve usar cache L1/L2', async () => {
      const mockResult = [createDimensoesQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      await ItemDimensoesRepository.getDimensoes('7530110');

      expect(QueryCacheService.withItemCache).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erros do banco de dados', async () => {
      const dbError = new Error('Conexão perdida');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(dbError);

      await expect(ItemDimensoesRepository.getDimensoes('7530110')).rejects.toThrow(
        'Conexão perdida'
      );
    });

    it('deve construir query com múltiplos openquery', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemDimensoesRepository.getDimensoes('7530110');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      // Valida estrutura da query (case insensitive)
      expect(query.toLowerCase()).toContain('declare @itemcodigo varchar(16)');
      expect(query.toLowerCase()).toContain('prd_ems2esp');
      expect(query.toLowerCase()).toContain('prd_ems2emp');
      expect(query.toLowerCase()).toContain('ext-item');
      expect(query.toLowerCase()).toContain('embalag');
      expect(query).toContain('EXEC sp_executesql');
    });

    it('deve retornar todos os campos de dimensões', async () => {
      const mockResult = [createDimensoesQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemDimensoesRepository.getDimensoes('7530110');

      // Valida campos da peça
      expect(result).toHaveProperty('pecaAltura');
      expect(result).toHaveProperty('pecaLargura');
      expect(result).toHaveProperty('pecaProfundidade');
      expect(result).toHaveProperty('pecaPeso');

      // Valida campos do item
      expect(result).toHaveProperty('itemEmbalagemAltura');
      expect(result).toHaveProperty('itemEmbaladoPeso');
      expect(result).toHaveProperty('pecasItem');

      // Valida campos do produto
      expect(result).toHaveProperty('produtoGTIN13');
      expect(result).toHaveProperty('itensProduto');

      // Valida campos da embalagem
      expect(result).toHaveProperty('embalagemSigla');
      expect(result).toHaveProperty('embalagemAltura');

      // Valida campos do palete
      expect(result).toHaveProperty('paleteLastro');
      expect(result).toHaveProperty('paleteCamadas');
      expect(result).toHaveProperty('caixasPalete');
    });

    it('deve tratar valores null corretamente', async () => {
      const mockResult = [createDimensoesVazias()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemDimensoesRepository.getDimensoes('7530110');

      expect(result!.pecaAltura).toBeNull();
      expect(result!.produtoGTIN13).toBeNull();
      expect(result!.embalagemSigla).toBeNull();
    });
  });

  // ========================================
  // invalidateCache
  // ========================================
  describe('invalidateCache', () => {
    it('deve invalidar cache de item', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await ItemDimensoesRepository.invalidateCache('7530110');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['item:*']);
    });
  });

  // ========================================
  // CENÁRIOS DE ERRO
  // ========================================
  describe('Tratamento de Erros', () => {
    it('deve tratar timeout do banco de dados', async () => {
      const timeoutError = new Error('Timeout: Request failed to complete');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(timeoutError);

      await expect(ItemDimensoesRepository.getDimensoes('7530110')).rejects.toThrow('Timeout');
    });

    it('deve tratar erro de conexão perdida', async () => {
      const connectionError = new Error('ECONNREFUSED');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(connectionError);

      await expect(ItemDimensoesRepository.getDimensoes('7530110')).rejects.toThrow('ECONNREFUSED');
    });

    it('deve tratar erro de sintaxe SQL', async () => {
      const sqlError = new Error('Incorrect syntax near');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(sqlError);

      await expect(ItemDimensoesRepository.getDimensoes('7530110')).rejects.toThrow(
        'Incorrect syntax'
      );
    });
  });

  // ========================================
  // INTEGRAÇÃO COM CACHE
  // ========================================
  describe('Integração com Cache', () => {
    it('deve retornar dados do cache em cache hit', async () => {
      const cachedData = [createDimensoesQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockResolvedValue(cachedData);

      const result = await ItemDimensoesRepository.getDimensoes('7530110');

      expect(result).toEqual(cachedData[0]);
      expect(DatabaseManager.queryEmpWithParams).not.toHaveBeenCalled();
    });

    it('deve buscar do banco em cache miss', async () => {
      const dbData = [createDimensoesQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(dbData);

      const result = await ItemDimensoesRepository.getDimensoes('7530110');

      expect(result).toEqual(dbData[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });
  });
});
