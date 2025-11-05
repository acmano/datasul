// src/estabelecimento/dadosCadastrais/informacoesGerais/__tests__/repository.test.ts

import { EstabelecimentoInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - EstabelecimentoInformacoesGeraisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEstabelecimentoMaster', () => {
    it('deve retornar dados quando encontrado', async () => {
      const mockData = [
        {
          codigo: 'TEST123',
          nome: 'Estabelecimento Teste',
        },
      ];

      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue(mockData);

      const result =
        await EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster('TEST123');

      expect(result).toEqual(mockData[0]);
    });

    it('deve retornar null quando não encontrado', async () => {
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([]);

      const result =
        await EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster('INEXISTENTE');

      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache corretamente', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await EstabelecimentoInformacoesGeraisRepository.invalidateCache('TEST123');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['estabelecimento:*']);
    });
  });
});
