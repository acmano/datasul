// src/item/search/__tests__/repository.test.ts

import { ItemSearchRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/logger');

describe('Repository - ItemSearchRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchItems - Sucesso', () => {
    it('deve retornar itens encontrados', async () => {
      const mockData = [
        {
          codigo: 'TEST123',
          descricao: 'Item Teste',
          itemUnidade: 'PC',
          familiaCodigo: '450000',
          familiaDescricao: 'Familia Teste',
          familiaComercialCodigo: 'FC001',
          familiaComercialDescricao: 'FC Teste',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: 'Grupo Teste',
          gtin13: '7896451824813',
          gtin14: null,
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemSearchRepository.searchItems({ familia: '450000' });

      expect(result).toHaveLength(1);
      expect(result[0].item.codigo).toBe('TEST123');
      expect(result[0].item.familia.codigo).toBe('450000');
      expect(result[0].item.familiaComercial.codigo).toBe('FC001');
      expect(result[0].item.grupoDeEstoque.codigo).toBe(40);
    });

    it('deve retornar array vazio quando não encontrar', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      const result = await ItemSearchRepository.searchItems({ codigo: 'INEXISTENTE' });

      expect(result).toEqual([]);
    });

    it('deve construir WHERE clause corretamente para código exato', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemSearchRepository.searchItems({ codigo: 'TEST123' });

      const call = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0];
      const query = call[0];

      // Verifica que usa SQL direto com aspas simples escapadas
      expect(query).toContain("item.\"it-codigo\" = ''TEST123''");
    });

    it('deve usar LIKE para código com wildcard', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemSearchRepository.searchItems({ codigo: 'TEST*' });

      const call = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0];
      const query = call[0];

      expect(query).toContain("item.\"it-codigo\" LIKE ''TEST%''");
    });

    it('deve usar LIKE para descrição sem wildcard (busca parcial)', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemSearchRepository.searchItems({ descricao: 'Parafuso' });

      const call = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0];
      const query = call[0];

      expect(query).toContain("item.\"desc-item\" LIKE ''%Parafuso%''");
    });

    it('deve usar LIKE para descrição com wildcard explícito', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemSearchRepository.searchItems({ descricao: 'Para*fuso' });

      const call = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0];
      const query = call[0];

      expect(query).toContain("item.\"desc-item\" LIKE ''Para%fuso''");
    });

    it('deve construir WHERE com família usando SQL direto', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemSearchRepository.searchItems({ familia: '450000' });

      const call = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0];
      const query = call[0];

      expect(query).toContain("item.\"fm-codigo\" = ''450000''");
    });

    it('deve construir WHERE com múltiplos critérios (AND)', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemSearchRepository.searchItems({
        descricao: 'Parafuso',
        familia: '450000',
        grupoEstoque: '40',
      });

      const call = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0];
      const query = call[0];

      // Verifica que usa AND para combinar critérios
      expect(query).toContain('AND');
      expect(query).toContain("item.\"desc-item\" LIKE ''%Parafuso%''");
      expect(query).toContain("item.\"fm-codigo\" = ''450000''");
      expect(query).toContain('item."ge-codigo" = 40');
    });

    it('deve mapear gtin13 e gtin14 quando existir', async () => {
      const mockData = [
        {
          codigo: 'TEST123',
          descricao: 'Item Teste',
          itemUnidade: 'PC',
          familiaCodigo: '450000',
          familiaDescricao: 'Familia Teste',
          familiaComercialCodigo: 'FC001',
          familiaComercialDescricao: 'FC Teste',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: 'Grupo Teste',
          gtin13: '7896451824813',
          gtin14: '17896451824813',
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemSearchRepository.searchItems({ codigo: 'TEST123' });

      expect(result[0].item.gtin13).toBe('7896451824813');
      expect(result[0].item.gtin14).toBe('17896451824813');
    });

    it('gtin13 e gtin14 devem ser undefined quando não existir', async () => {
      const mockData = [
        {
          codigo: 'TEST123',
          descricao: 'Item Teste',
          itemUnidade: 'PC',
          familiaCodigo: '450000',
          familiaDescricao: 'Familia Teste',
          familiaComercialCodigo: 'FC001',
          familiaComercialDescricao: 'FC Teste',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: 'Grupo Teste',
          gtin13: null,
          gtin14: null,
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemSearchRepository.searchItems({ codigo: 'TEST123' });

      expect(result[0].item.gtin13).toBeUndefined();
      expect(result[0].item.gtin14).toBeUndefined();
    });

    it('deve fazer trim em todos os campos string', async () => {
      const mockData = [
        {
          codigo: '  TEST123  ',
          descricao: '  Item Teste  ',
          itemUnidade: '  PC  ',
          familiaCodigo: '  450000  ',
          familiaDescricao: '  Familia Teste  ',
          familiaComercialCodigo: '  FC001  ',
          familiaComercialDescricao: '  FC Teste  ',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: '  Grupo Teste  ',
          gtin13: null,
          gtin14: null,
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemSearchRepository.searchItems({ codigo: 'TEST123' });

      expect(result[0].item.codigo).toBe('TEST123');
      expect(result[0].item.descricao).toBe('Item Teste');
      expect(result[0].item.unidade).toBe('PC');
      expect(result[0].item.familia.codigo).toBe('450000');
    });
  });

  describe('searchItems - Erros', () => {
    it('deve propagar erro do banco', async () => {
      const dbError = new Error('Erro de conexão');
      (DatabaseManager.queryEmp as jest.Mock).mockRejectedValue(dbError);

      await expect(ItemSearchRepository.searchItems({ familia: '450000' })).rejects.toThrow(
        'Erro de conexão'
      );
    });
  });
});
