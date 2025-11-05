// src/item/dadosCadastrais/dimensoes/__tests__/integration.test.ts

import { DimensoesController } from '../controller';
import { DimensoesService } from '../service';
import { ItemDimensoesRepository } from '../repository';
// // Unused: // Unused: import { ItemNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';
import { Request, Response } from 'express';
import {
  createDimensoesQueryResult,
  createDimensoesVazias,
  createDimensoesSemEmbalagem,
} from '@tests/factories/dimensoes.factory';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@shared/validators/paramValidators', () => ({
  validateItemCodigo: jest.fn((codigo: string) => {
    if (!codigo || codigo.trim() === '') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ValidationError } = require('@shared/errors/CustomErrors');
      throw new ValidationError('Código do item é obrigatório');
    }
    return codigo.trim();
  }),
}));

describe('Integration - Dimensoes (Controller → Service → Repository)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: { itemCodigo: '7530110' },
      id: 'test-correlation-id',
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  // ========================================
  // FLUXO COMPLETO DE SUCESSO
  // ========================================
  describe('Fluxo Completo de Sucesso', () => {
    it('deve retornar dimensões completas do item', async () => {
      const mockData = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      // Valida que repository foi chamado
      expect(ItemDimensoesRepository.getDimensoes).toHaveBeenCalledWith('7530110');

      // Valida resposta
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          itemCodigo: '7530110',
          itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
          peca: expect.any(Object),
          item: expect.any(Object),
          produto: expect.any(Object),
          caixa: expect.any(Object),
          palete: expect.any(Object),
        }),
      });
    });

    it('deve transformar dados raw em estrutura aninhada', async () => {
      const mockData = createDimensoesQueryResult({
        pecaAltura: 15.5,
        itemEmbalagemLargura: 20.0,
        produtoGTIN13: '1234567890123',
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      // Valida transformação
      expect(responseData.peca.altura).toBe(15.5);
      expect(responseData.item.embalagem.largura).toBe(20.0);
      expect(responseData.produto.gtin13).toBe('1234567890123');
    });

    it('deve processar item com dimensões vazias', async () => {
      const mockData = createDimensoesVazias();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      expect(responseData.peca.altura).toBeNull();
      expect(responseData.item.pecas).toBeNull();
      expect(responseData.produto.gtin13).toBeNull();
    });

    it('deve processar item sem embalagem', async () => {
      const mockData = createDimensoesSemEmbalagem();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      expect(responseData.caixa.embalagem.sigla).toBeNull();
      expect(responseData.caixa.embalagem.altura).toBeNull();
    });
  });

  // ========================================
  // TRATAMENTO DE ERROS NO FLUXO
  // ========================================
  describe('Tratamento de Erros no Fluxo', () => {
    it('deve não retornar resposta quando repository retorna null', async () => {
      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(null);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve não retornar resposta em erro de banco', async () => {
      const dbError = new Error('Connection lost');

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockRejectedValue(dbError);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // VALIDAÇÃO DE DADOS ATRAVÉS DAS CAMADAS
  // ========================================
  describe('Validação de Dados', () => {
    it('deve validar código antes de chamar repository', async () => {
      mockRequest.params = { itemCodigo: '7530110' };
      const mockData = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      expect(ItemDimensoesRepository.getDimensoes).toHaveBeenCalledWith('7530110');
    });

    it('deve não chamar repository com código vazio', async () => {
      mockRequest.params = { itemCodigo: '' };

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ItemDimensoesRepository.getDimensoes).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // MAPEAMENTO DE DADOS
  // ========================================
  describe('Mapeamento de Dados Entre Camadas', () => {
    it('deve mapear todos os campos numéricos corretamente', async () => {
      const mockData = createDimensoesQueryResult({
        pecaAltura: 10.5,
        pecaLargura: 8.3,
        pecaProfundidade: 6.2,
        pecaPeso: 0.25,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      expect(responseData.peca.altura).toBe(10.5);
      expect(responseData.peca.largura).toBe(8.3);
      expect(responseData.peca.profundidade).toBe(6.2);
      expect(responseData.peca.peso).toBe(0.25);
    });

    it('deve mapear strings corretamente (GTINs)', async () => {
      const mockData = createDimensoesQueryResult({
        produtoGTIN13: '7891234567890',
        caixaGTIN14: '17891234567897',
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      expect(responseData.produto.gtin13).toBe('7891234567890');
      expect(responseData.caixa.gtin14).toBe('17891234567897');
    });

    it('deve preservar valores null através das camadas', async () => {
      const mockData = createDimensoesQueryResult({
        paleteLastro: null,
        paleteCamadas: null,
        caixasPalete: null,
      });

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver antes de verificar resposta
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      expect(responseData.palete.lastro).toBeNull();
      expect(responseData.palete.camadas).toBeNull();
      expect(responseData.palete.caixasPalete).toBeNull();
    });
  });

  // ========================================
  // PERFORMANCE E OTIMIZAÇÃO
  // ========================================
  describe('Performance e Otimização', () => {
    it('deve fazer apenas 1 chamada ao repository', async () => {
      const mockData = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      expect(ItemDimensoesRepository.getDimensoes).toHaveBeenCalledTimes(1);
    });

    it('deve processar resposta rapidamente (< 100ms simulado)', async () => {
      const mockData = createDimensoesQueryResult();

      (ItemDimensoesRepository.getDimensoes as jest.Mock).mockResolvedValue(mockData);
      const serviceSpy = jest.spyOn(DimensoesService, 'getDimensoes');

      const start = Date.now();

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Aguarda Service resolver
      if (serviceSpy.mock.results[0]?.type === 'return') {
        await serviceSpy.mock.results[0].value;
      }

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
