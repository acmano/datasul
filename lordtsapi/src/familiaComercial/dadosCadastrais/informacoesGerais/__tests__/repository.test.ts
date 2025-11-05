import { FamiliaComercialInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - FamiliaComercialInformacoesGeraisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFamiliaComercialMaster', () => {
    it('deve retornar dados quando encontrado', async () => {
      const mockData = [
        {
          familiaComercialCodigo: 'TEST123',
          familiaComercialDescricao: 'Teste',
        },
      ];

      (QueryCacheService.withFamiliaComercialCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockData);

      const result =
        await FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster('TEST123');

      expect(result).toEqual(mockData[0]);
    });

    it('deve retornar null quando não encontrado', async () => {
      (QueryCacheService.withFamiliaComercialCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result =
        await FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster('INEXISTENTE');

      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache corretamente', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await FamiliaComercialInformacoesGeraisRepository.invalidateCache('TEST123');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['familiaComercial:*']);
    });
  });
});
