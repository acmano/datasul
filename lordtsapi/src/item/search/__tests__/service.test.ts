// src/item/search/__tests__/service.test.ts

import { ItemSearchService } from '../service';
import { ItemSearchRepository } from '../repository';
import { DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger');

describe('Service - ItemSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchItems - Sucesso', () => {
    it('deve retornar resposta com critérios e dados', async () => {
      const mockItems = [
        {
          item: {
            codigo: 'TEST123',
            descricao: 'Item Teste',
            unidade: 'PC',
            familia: {
              codigo: '450000',
              descricao: 'Familia Teste',
            },
            familiaComercial: {
              codigo: 'FC001',
              descricao: 'FC Teste',
            },
            grupoDeEstoque: {
              codigo: 40,
              descricao: 'Grupo Teste',
            },
          },
        },
      ];

      (ItemSearchRepository.searchItems as jest.Mock).mockResolvedValue(mockItems);

      const result = await ItemSearchService.searchItems({ familia: '450000' });

      expect(result.success).toBe(true);
      expect(result.criteriosDeBusca.familia).toBe('450000');
      expect(result.data).toEqual(mockItems);
      expect(result.total).toBe(1);
    });

    it('deve retornar critérios vazios para parâmetros não informados', async () => {
      (ItemSearchRepository.searchItems as jest.Mock).mockResolvedValue([]);

      const result = await ItemSearchService.searchItems({ familia: '450000' });

      expect(result.criteriosDeBusca.codigo).toBe('');
      expect(result.criteriosDeBusca.familia).toBe('450000');
      expect(result.criteriosDeBusca.familiaComercial).toBe('');
      expect(result.criteriosDeBusca.grupoEstoque).toBe('');
      expect(result.criteriosDeBusca.gtin).toBe('');
    });

    it('deve retornar todos os critérios quando informados', async () => {
      (ItemSearchRepository.searchItems as jest.Mock).mockResolvedValue([]);

      const params = {
        codigo: 'TEST123',
        familia: '450000',
        familiaComercial: 'FC001',
        grupoEstoque: '40',
        gtin: '7896451824813',
      };

      const result = await ItemSearchService.searchItems(params);

      expect(result.criteriosDeBusca.codigo).toBe('TEST123');
      expect(result.criteriosDeBusca.familia).toBe('450000');
      expect(result.criteriosDeBusca.familiaComercial).toBe('FC001');
      expect(result.criteriosDeBusca.grupoEstoque).toBe('40');
      expect(result.criteriosDeBusca.gtin).toBe('7896451824813');
    });

    it('deve retornar total correto', async () => {
      const mockItems = [
        {
          item: {
            codigo: 'A',
            descricao: 'A',
            unidade: 'PC',
            familia: { codigo: '1', descricao: '1' },
            familiaComercial: { codigo: '1', descricao: '1' },
            grupoDeEstoque: { codigo: '1', descricao: '1' },
          },
        },
        {
          item: {
            codigo: 'B',
            descricao: 'B',
            unidade: 'PC',
            familia: { codigo: '1', descricao: '1' },
            familiaComercial: { codigo: '1', descricao: '1' },
            grupoDeEstoque: { codigo: '1', descricao: '1' },
          },
        },
        {
          item: {
            codigo: 'C',
            descricao: 'C',
            unidade: 'PC',
            familia: { codigo: '1', descricao: '1' },
            familiaComercial: { codigo: '1', descricao: '1' },
            grupoDeEstoque: { codigo: '1', descricao: '1' },
          },
        },
      ];

      (ItemSearchRepository.searchItems as jest.Mock).mockResolvedValue(mockItems);

      const result = await ItemSearchService.searchItems({ familia: '450000' });

      expect(result.total).toBe(3);
    });

    it('deve retornar zero quando não encontrar resultados', async () => {
      (ItemSearchRepository.searchItems as jest.Mock).mockResolvedValue([]);

      const result = await ItemSearchService.searchItems({ codigo: 'INEXISTENTE' });

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('searchItems - Erros', () => {
    it('deve lançar DatabaseError quando repositório falha', async () => {
      const dbError = new Error('Erro de conexão');
      (ItemSearchRepository.searchItems as jest.Mock).mockRejectedValue(dbError);

      await expect(ItemSearchService.searchItems({ familia: '450000' })).rejects.toThrow(
        DatabaseError
      );
    });

    it('deve incluir mensagem de erro original', async () => {
      const dbError = new Error('Conexão perdida');
      (ItemSearchRepository.searchItems as jest.Mock).mockRejectedValue(dbError);

      try {
        await ItemSearchService.searchItems({ familia: '450000' });
      } catch (_error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar itens');
      }
    });
  });
});
