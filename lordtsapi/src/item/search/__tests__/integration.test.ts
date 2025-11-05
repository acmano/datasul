// src/item/search/__tests__/integration.test.ts

import { ItemSearchController } from '../controller';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { Request, Response } from 'express';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/logger');

describe('Integration - Item Search', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = { body: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('deve buscar itens por família (fluxo completo)', async () => {
    const mockDbData = [
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

    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

    mockRequest.body = { familia: '450000' };

    await ItemSearchController.searchItems(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 1,
        criteriosDeBusca: expect.objectContaining({
          familia: '450000',
        }),
      })
    );

    const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(responseData.data[0].item.codigo).toBe('TEST123');
    expect(responseData.data[0].item.familia.codigo).toBe('450000');
  });

  it('deve retornar array vazio quando não encontrar (fluxo completo)', async () => {
    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

    mockRequest.body = { codigo: 'INEXISTENTE' };

    await ItemSearchController.searchItems(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 0,
        data: [],
      })
    );
  });

  it('deve buscar por múltiplos critérios (fluxo completo)', async () => {
    const mockDbData = [
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

    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

    mockRequest.body = {
      familia: '450000',
      grupoEstoque: '40',
    };

    await ItemSearchController.searchItems(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const query = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0][0];
    expect(query).toContain("item.\"fm-codigo\" = ''450000''");
    expect(query).toContain('AND');

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it('deve propagar erro de banco (fluxo completo)', async () => {
    const dbError = new Error('Erro de conexão');
    (DatabaseManager.queryEmp as jest.Mock).mockRejectedValue(dbError);

    mockRequest.body = { familia: '450000' };

    await ItemSearchController.searchItems(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
