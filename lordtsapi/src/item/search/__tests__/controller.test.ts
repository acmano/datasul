// src/item/search/__tests__/controller.test.ts

import { Request, Response } from 'express';
import { ItemSearchController } from '../controller';
import { ItemSearchService } from '../service';

jest.mock('../service');

describe('Controller - ItemSearchController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('searchItems - Sucesso', () => {
    it('deve retornar 200 com resultados', async () => {
      const mockResult = {
        success: true,
        criteriosDeBusca: {
          codigo: '',
          familia: '450000',
          familiaComercial: '',
          grupoEstoque: '',
          gtin: '',
        },
        data: [
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
        ],
        total: 1,
      };

      mockRequest.body = { familia: '450000' };

      (ItemSearchService.searchItems as jest.Mock).mockResolvedValue(mockResult);

      await ItemSearchController.searchItems(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve passar parâmetros corretos para o service', async () => {
      const params = {
        codigo: 'TEST123',
        familia: '450000',
      };

      mockRequest.body = params;

      (ItemSearchService.searchItems as jest.Mock).mockResolvedValue({
        success: true,
        criteriosDeBusca: params,
        data: [],
        total: 0,
      });

      await ItemSearchController.searchItems(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ItemSearchService.searchItems).toHaveBeenCalledWith(params);
    });
  });

  describe('searchItems - Erros', () => {
    it('deve chamar next com erro quando service falha', async () => {
      const error = new Error('Erro no service');
      mockRequest.body = { familia: '450000' };

      (ItemSearchService.searchItems as jest.Mock).mockRejectedValue(error);

      await ItemSearchController.searchItems(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
