import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisController } from '../controller';
import { InformacoesGeraisService } from '../service';
import { FamiliaComercialNotFoundError, ValidationError } from '@shared/errors/CustomErrors';

jest.mock('../service');

describe('Controller - InformacoesGeraisController (FamiliaComercial)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = { params: {} };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar 200 com dados', async () => {
      const mockData = { test: 'data' };
      mockRequest.params = { familiaComercialCodigo: 'TEST123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });
  });

});
