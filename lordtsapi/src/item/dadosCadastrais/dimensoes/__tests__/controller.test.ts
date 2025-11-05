// src/item/dadosCadastrais/dimensoes/__tests__/controller.test.ts

import { Request, Response } from 'express';
import { DimensoesController } from '../controller';
import { DimensoesService } from '../service';
import { ItemNotFoundError, ValidationError } from '@shared/errors/CustomErrors';
import { createDimensoesResponse } from '@tests/factories/dimensoes.factory';

jest.mock('../service');
jest.mock('@shared/validators/paramValidators', () => ({
  validateItemCodigo: jest.fn((codigo: string) => codigo),
}));

describe('Controller - DimensoesController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { validateItemCodigo } = require('@shared/validators/paramValidators');
    validateItemCodigo.mockImplementation((codigo: string) => codigo);

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
  // CASOS DE SUCESSO
  // ========================================
  describe('getDimensoes - Sucesso', () => {
    it('deve retornar dimensões com sucesso', async () => {
      const mockData = createDimensoesResponse();

      (DimensoesService.getDimensoes as jest.Mock).mockResolvedValue(mockData);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve chamar service com código do item correto', async () => {
      const mockData = createDimensoesResponse();

      (DimensoesService.getDimensoes as jest.Mock).mockResolvedValue(mockData);

      mockRequest.params = { itemCodigo: 'ABC123' };

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(DimensoesService.getDimensoes).toHaveBeenCalledWith('ABC123');
    });

    it('deve validar código do item antes de chamar service', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validateItemCodigo } = require('@shared/validators/paramValidators');
      const mockData = createDimensoesResponse();

      (DimensoesService.getDimensoes as jest.Mock).mockResolvedValue(mockData);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(validateItemCodigo).toHaveBeenCalledWith('7530110');
    });
  });

  // ========================================
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('getDimensoes - Item Não Encontrado', () => {
    it('deve não retornar resposta quando item não existe', async () => {
      const error = new ItemNotFoundError('INEXISTENTE');

      (DimensoesService.getDimensoes as jest.Mock).mockRejectedValue(error);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve não retornar resposta quando service retorna null', async () => {
      (DimensoesService.getDimensoes as jest.Mock).mockResolvedValue(null);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // VALIDAÇÃO DE ENTRADA
  // ========================================
  describe('getDimensoes - Validação', () => {
    it('deve capturar erro de validação', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validateItemCodigo } = require('@shared/validators/paramValidators');
      const validationError = new ValidationError('Código inválido');

      validateItemCodigo.mockImplementation(() => {
        throw validationError;
      });

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getDimensoes - Erros', () => {
    it('deve não retornar resposta em erros do service', async () => {
      const serviceError = new Error('Erro inesperado');

      (DimensoesService.getDimensoes as jest.Mock).mockRejectedValue(serviceError);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // ESTRUTURA DE RESPOSTA
  // ========================================
  describe('Estrutura de Resposta', () => {
    it('deve retornar estrutura padronizada de sucesso', async () => {
      const mockData = createDimensoesResponse();

      (DimensoesService.getDimensoes as jest.Mock).mockResolvedValue(mockData);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        })
      );
    });

    it('deve retornar todos os níveis de dimensões', async () => {
      const mockData = createDimensoesResponse();

      (DimensoesService.getDimensoes as jest.Mock).mockResolvedValue(mockData);

      await DimensoesController.getDimensoes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;

      expect(responseData).toHaveProperty('peca');
      expect(responseData).toHaveProperty('item');
      expect(responseData).toHaveProperty('produto');
      expect(responseData).toHaveProperty('caixa');
      expect(responseData).toHaveProperty('palete');
    });
  });
});
