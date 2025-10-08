import { GrupoDeEstoqueInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - GrupoDeEstoqueInformacoesGeraisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGrupoDeEstoqueMaster', () => {
    it('deve retornar dados quando encontrado', async () => {
      const mockData = [{
        grupoDeEstoqueCodigo: 'TEST123',
        grupoDeEstoqueDescricao: 'Teste'
      }];

      (QueryCacheService.withGrupoDeEstoqueCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockData);

      const result = await GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster('TEST123');

      expect(result).toEqual(mockData[0]);
    });

    it('deve retornar null quando não encontrado', async () => {
      (QueryCacheService.withGrupoDeEstoqueCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster('INEXISTENTE');

      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache corretamente', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await GrupoDeEstoqueInformacoesGeraisRepository.invalidateCache('TEST123');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['grupoDeEstoque:*']);
    });
  });
});
