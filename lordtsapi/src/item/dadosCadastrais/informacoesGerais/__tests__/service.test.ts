// tests/unit/services/informacoesGerais.service.test.ts

import { InformacoesGeraisService } from '../service';
import { ItemInformacoesGeraisRepository } from '../repository';
import { ItemNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Helper para criar mock completo
const createMockCompleto = (overrides = {}) => ({
  item: {
    itemCodigo: '7530110',
    itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    itemUnidade: 'UN',
    familiaCodigo: 'F001',
    familiaComercialCodigo: null,
    grupoDeEstoqueCodigo: null,
  },
  familia: {
    familiaCodigo: 'F001',
    familiaDescricao: 'Válvulas'
  },
  familiaComercial: null,
  grupoDeEstoque: null,
  estabelecimentos: [
    { codigo: '01.01', nome: 'CD São Paulo' }
  ],
  ...overrides
});

describe('Service - InformacoesGeraisService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getInformacoesGerais - Sucesso', () => {

    it('deve retornar informações completas do item', async () => {
      const mock = createMockCompleto({
        estabelecimentos: [
          { codigo: '01.01', nome: 'CD São Paulo' },
          { codigo: '02.01', nome: 'Filial' }
        ]
      });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result).toBeDefined();
      expect(result.item.codigo).toBe('7530110');
      expect(result.item.descricao).toBe('VALVULA DE ESFERA 1/2" BRONZE');
      expect(result.item.unidade).toBe('UN');
      expect(result.estabelecimentos).toHaveLength(2);
    });

    it('deve transformar dados do repository para DTO de resposta', async () => {
      const mock = createMockCompleto();

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      // Valida mapeamento de campos
      expect(result).toHaveProperty('item');
      expect(result.item).toHaveProperty('codigo');
      expect(result.item).toHaveProperty('descricao');
      expect(result.item).toHaveProperty('unidade');
      expect(result).toHaveProperty('familia');
      expect(result).toHaveProperty('familiaComercial');
      expect(result).toHaveProperty('grupoDeEstoque');
      expect(result).toHaveProperty('estabelecimentos');
    });

    it('deve retornar item com array vazio de estabelecimentos', async () => {
      const mock = createMockCompleto({ estabelecimentos: [] });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.estabelecimentos).toEqual([]);
    });

    it('deve mapear todos os campos do estabelecimento', async () => {
      const mock = createMockCompleto({
        estabelecimentos: [
          { codigo: '01.01', nome: 'CD São Paulo' }
        ]
      });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      const estab = result.estabelecimentos[0];
      expect(estab.codigo).toBe('01.01');
      expect(estab.nome).toBe('CD São Paulo');
    });

    it('deve mapear família quando existe', async () => {
      const mock = createMockCompleto();

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.familia).toBeDefined();
      expect(result.familia.codigo).toBe('F001');
      expect(result.familia.descricao).toBe('Válvulas');
    });

    it('deve retornar família null quando não existe', async () => {
      const mock = createMockCompleto({ familia: null });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.familia).toBeNull();
    });

    it('deve retornar familiaComercial null quando não existe', async () => {
      const mock = createMockCompleto();

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.familiaComercial).toBeNull();
    });

    it('deve retornar grupoDeEstoque null quando não existe', async () => {
      const mock = createMockCompleto();

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.grupoDeEstoque).toBeNull();
    });

  });

  // ========================================
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('getInformacoesGerais - Item Não Encontrado', () => {

    it('deve lançar ItemNotFoundError quando item não existe', async () => {
      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue({
        item: null,
        familia: null,
        familiaComercial: null,
        grupoDeEstoque: null,
        estabelecimentos: []
      });

      await expect(
        InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')
      ).rejects.toThrow(ItemNotFoundError);
    });

    it('deve incluir código do item na mensagem de erro', async () => {
      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue({
        item: null,
        familia: null,
        familiaComercial: null,
        grupoDeEstoque: null,
        estabelecimentos: []
      });

      try {
        await InformacoesGeraisService.getInformacoesGerais('ABC123');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(ItemNotFoundError);
        expect((error as ItemNotFoundError).message).toContain('ABC123');
      }
    });

    it('deve logar quando item não é encontrado', async () => {
      const { log } = require('@shared/utils/logger');

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue({
        item: null,
        familia: null,
        familiaComercial: null,
        grupoDeEstoque: null,
        estabelecimentos: []
      });

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
      } catch (error) {
        // Esperado
      }

      expect(log.info).toHaveBeenCalledWith(
        'Item não encontrado',
        { itemCodigo: '7530110' }
      );
    });

  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getInformacoesGerais - Tratamento de Erros', () => {

    it('deve re-lançar ItemNotFoundError sem conversão', async () => {
      const notFoundError = new ItemNotFoundError('7530110');

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockRejectedValue(notFoundError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('7530110')
      ).rejects.toThrow(ItemNotFoundError);
    });

    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockRejectedValue(dbError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('7530110')
      ).rejects.toThrow(DatabaseError);
    });

    it('deve incluir erro original em DatabaseError', async () => {
      const originalError = new Error('Timeout SQL');

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockRejectedValue(originalError);

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar');
      }
    });

    it('deve logar erros de banco', async () => {
      const { log } = require('@shared/utils/logger');
      const dbError = new Error('Erro SQL');

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockRejectedValue(dbError);

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
      } catch (error) {
        // Esperado
      }

      expect(log.error).toHaveBeenCalledWith(
        'Erro ao buscar informações gerais',
        expect.objectContaining({
          itemCodigo: '7530110',
          error: 'Erro SQL'
        })
      );
    });

  });

  // ========================================
  // INTEGRAÇÃO COM REPOSITORY
  // ========================================
  describe('Integração com Repository', () => {

    it('deve chamar getItemCompleto com código correto', async () => {
      const mock = createMockCompleto();

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      await InformacoesGeraisService.getInformacoesGerais('ABC123');

      expect(ItemInformacoesGeraisRepository.getItemCompleto).toHaveBeenCalledWith('ABC123');
      expect(ItemInformacoesGeraisRepository.getItemCompleto).toHaveBeenCalledTimes(1);
    });

  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {

    it('deve tratar item com descrição vazia', async () => {
      const mock = createMockCompleto({
        item: {
          itemCodigo: '7530110',
          itemDescricao: '',
          itemUnidade: 'UN'
        }
      });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.item.descricao).toBe('');
    });

    it('deve tratar múltiplos estabelecimentos (10+)', async () => {
      const estabs = Array.from({ length: 15 }, (_, i) => ({
        codigo: `0${(i + 1).toString().padStart(2, '0')}.01`,
        nome: `Estab ${i + 1}`
      }));

      const mock = createMockCompleto({ estabelecimentos: estabs });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.estabelecimentos).toHaveLength(15);
    });

    it('deve tratar nome de estabelecimento null', async () => {
      const mock = createMockCompleto({
        estabelecimentos: [
          { codigo: '01.01', nome: null as any }
        ]
      });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.estabelecimentos[0].nome).toBeNull();
    });

    it('deve mapear familiaComercial quando existe', async () => {
      const mock = createMockCompleto({
        familiaComercial: {
          familiaComercialCodigo: 'FC01',
          familiaComercialDescricao: 'Comercial 1'
        }
      });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.familiaComercial).toBeDefined();
      expect(result.familiaComercial.codigo).toBe('FC01');
      expect(result.familiaComercial.descricao).toBe('Comercial 1');
    });

    it('deve mapear grupoDeEstoque quando existe', async () => {
      const mock = createMockCompleto({
        grupoDeEstoque: {
          grupoDeEstoqueCodigo: 'G1',
          grupoDeEstoqueDescricao: 'Grupo 1'
        }
      });

      (ItemInformacoesGeraisRepository.getItemCompleto as jest.Mock).mockResolvedValue(mock);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.grupoDeEstoque).toBeDefined();
      expect(result.grupoDeEstoque.codigo).toBe('G1');
      expect(result.grupoDeEstoque.descricao).toBe('Grupo 1');
    });

  });

});