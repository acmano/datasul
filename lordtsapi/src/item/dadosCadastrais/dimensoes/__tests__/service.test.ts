// src/item/dadosCadastrais/dimensoes/__tests__/service.test.ts

import { DimensoesService } from '../service';
import { ItemDimensoesRepository } from '../repository';
import { ItemNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';
import {
  createDimensoesQueryResult,
  createDimensoesVazias,
  createDimensoesSemEmbalagem,
  createDimensoesSemPalete,
} from '@tests/factories/dimensoes.factory';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Service - DimensoesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getDimensoes - Sucesso', () => {
    it('deve retornar dimensões completas do item', async () => {
      const mock = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result).toBeDefined();
      expect(result.itemCodigo).toBe('7530110');
      expect(result.itemDescricao).toBe('VALVULA DE ESFERA 1/2" BRONZE');
    });

    it('deve transformar dados do repository para DTO estruturado', async () => {
      const mock = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      // Valida estrutura aninhada
      expect(result).toHaveProperty('peca');
      expect(result).toHaveProperty('item');
      expect(result).toHaveProperty('produto');
      expect(result).toHaveProperty('caixa');
      expect(result).toHaveProperty('palete');

      expect(result.item).toHaveProperty('pecas');
      expect(result.item).toHaveProperty('embalagem');
      expect(result.item).toHaveProperty('embalado');

      expect(result.produto).toHaveProperty('itens');
      expect(result.produto).toHaveProperty('gtin13');
      expect(result.produto).toHaveProperty('embalagem');
      expect(result.produto).toHaveProperty('embalado');
    });

    it('deve mapear corretamente dimensões da peça', async () => {
      const mock = createDimensoesQueryResult({
        pecaAltura: 15.5,
        pecaLargura: 10.2,
        pecaProfundidade: 8.7,
        pecaPeso: 0.45,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.peca.altura).toBe(15.5);
      expect(result.peca.largura).toBe(10.2);
      expect(result.peca.profundidade).toBe(8.7);
      expect(result.peca.peso).toBe(0.45);
    });

    it('deve mapear corretamente seção item', async () => {
      const mock = createDimensoesQueryResult({
        pecasItem: 2,
        itemEmbalagemAltura: 20.0,
        itemEmbaladoPeso: 0.6,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.item.pecas).toBe(2);
      expect(result.item.embalagem.altura).toBe(20.0);
      expect(result.item.embalado.peso).toBe(0.6);
    });

    it('deve mapear corretamente seção produto', async () => {
      const mock = createDimensoesQueryResult({
        itensProduto: 6,
        produtoGTIN13: '1234567890123',
        produtoEmbalagemAltura: 30.0,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.produto.itens).toBe(6);
      expect(result.produto.gtin13).toBe('1234567890123');
      expect(result.produto.embalagem.altura).toBe(30.0);
    });

    it('deve mapear corretamente seção caixa e embalagem', async () => {
      const mock = createDimensoesQueryResult({
        produtosCaixa: 10,
        caixaGTIN14: '12345678901234',
        embalagemSigla: 'PAP',
        embalagemAltura: 40.0,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.caixa.produtos).toBe(10);
      expect(result.caixa.gtin14).toBe('12345678901234');
      expect(result.caixa.embalagem.sigla).toBe('PAP');
      expect(result.caixa.embalagem.altura).toBe(40.0);
    });

    it('deve mapear corretamente seção palete', async () => {
      const mock = createDimensoesQueryResult({
        paleteLastro: 10,
        paleteCamadas: 8,
        caixasPalete: 80,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.palete.lastro).toBe(10);
      expect(result.palete.camadas).toBe(8);
      expect(result.palete.caixasPalete).toBe(80);
    });
  });

  // ========================================
  // CASOS COM VALORES NULL
  // ========================================
  describe('getDimensoes - Valores Null', () => {
    it('deve tratar dimensões vazias (todos nulls)', async () => {
      const mock = createDimensoesVazias();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.peca.altura).toBeNull();
      expect(result.peca.largura).toBeNull();
      expect(result.peca.profundidade).toBeNull();
      expect(result.peca.peso).toBeNull();
      expect(result.item.pecas).toBeNull();
      expect(result.produto.gtin13).toBeNull();
    });

    it('deve tratar item sem embalagem', async () => {
      const mock = createDimensoesSemEmbalagem();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.caixa.embalagem.sigla).toBeNull();
      expect(result.caixa.embalagem.altura).toBeNull();
      expect(result.caixa.embalagem.largura).toBeNull();
    });

    it('deve tratar item sem palete', async () => {
      const mock = createDimensoesSemPalete();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      const result = await DimensoesService.getDimensoes('7530110');

      expect(result.palete.lastro).toBeNull();
      expect(result.palete.camadas).toBeNull();
      expect(result.palete.caixasPalete).toBeNull();
    });
  });

  // ========================================
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('getDimensoes - Item Não Encontrado', () => {
    it('deve lançar ItemNotFoundError quando item não existe', async () => {
      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(null);

      await expect(DimensoesService.getDimensoes('INEXISTENTE')).rejects.toThrow(ItemNotFoundError);
    });

    it('deve incluir código do item na mensagem de erro', async () => {
      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(null);

      try {
        await DimensoesService.getDimensoes('ABC123');
        fail('Deveria ter lançado erro');
      } catch {
        expect(error).toBeInstanceOf(ItemNotFoundError);
        expect((error as ItemNotFoundError).message).toContain('ABC123');
      }
    });
  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getDimensoes - Tratamento de Erros', () => {
    it('deve re-lançar ItemNotFoundError sem conversão', async () => {
      const notFoundError = new ItemNotFoundError('7530110');

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockRejectedValue(notFoundError);

      await expect(DimensoesService.getDimensoes('7530110')).rejects.toThrow(ItemNotFoundError);
    });

    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockRejectedValue(dbError);

      await expect(DimensoesService.getDimensoes('7530110')).rejects.toThrow(DatabaseError);
    });

    it('deve incluir erro original em DatabaseError', async () => {
      const originalError = new Error('Timeout SQL');

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockRejectedValue(originalError);

      try {
        await DimensoesService.getDimensoes('7530110');
        fail('Deveria ter lançado erro');
      } catch {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar');
      }
    });
  });

  // ========================================
  // INTEGRAÇÃO COM REPOSITORY
  // ========================================
  describe('Integração com Repository', () => {
    it('deve chamar getDimensoes com código correto', async () => {
      const mock = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mock);

      await DimensoesService.getDimensoes('ABC123');

      expect(ItemDimensoesRepository.getDimensoes).toHaveBeenCalledWith('ABC123');
      expect(ItemDimensoesRepository.getDimensoes).toHaveBeenCalledTimes(1);
    });
  });
});
