// src/item/itemEmpresas/__tests__/controller.test.ts

import { Request, Response } from 'express';
import { ItemEmpresasController } from '../controller';
import { ItemEmpresasService } from '../service';

jest.mock('../service');

describe('Controller - ItemEmpresasController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getItemEmpresas - Sucesso', () => {
    it('deve retornar 200 com resultados', async () => {
      const mockResult = {
        success: true,
        data: {
          codigo: '7530110',
          empresas: [
            {
              codigo: '01',
              nome: 'Empresa ABC',
            },
            {
              codigo: '02',
              nome: 'Empresa XYZ',
            },
          ],
        },
        total: 2,
      };

      mockRequest.query = { codigo: '7530110' };

      (ItemEmpresasService.getItemEmpresas as jest.Mock).mockResolvedValue(mockResult);

      await ItemEmpresasController.getItemEmpresas(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve passar parâmetros corretos para o service', async () => {
      const params = { codigo: '7530110' };

      mockRequest.query = params;

      (ItemEmpresasService.getItemEmpresas as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          codigo: '7530110',
          empresas: [],
        },
        total: 0,
      });

      await ItemEmpresasController.getItemEmpresas(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ItemEmpresasService.getItemEmpresas).toHaveBeenCalledWith(params);
    });

    it('deve retornar resultado vazio quando item não tem empresas', async () => {
      const mockResult = {
        success: true,
        data: {
          codigo: '7530110',
          empresas: [],
        },
        total: 0,
      };

      mockRequest.query = { codigo: '7530110' };

      (ItemEmpresasService.getItemEmpresas as jest.Mock).mockResolvedValue(mockResult);

      await ItemEmpresasController.getItemEmpresas(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getItemEmpresas - Erros', () => {
    it('deve chamar next com erro quando service falha', async () => {
      const error = new Error('Erro no service');
      mockRequest.query = { codigo: '7530110' };

      (ItemEmpresasService.getItemEmpresas as jest.Mock).mockRejectedValue(error);

      await ItemEmpresasController.getItemEmpresas(
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
