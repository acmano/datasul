// src/item/itemEmpresas/__tests__/integration.test.ts

import { ItemEmpresasController } from '../controller';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { Request, Response } from 'express';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/logger');

describe('Integration - Item Empresas', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = { query: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('deve buscar empresas do item (fluxo completo)', async () => {
    const mockDbData = [
      {
        itemCodigo: '7530110',
        estabelecimentoCodigo: '01',
        estabelecimentoNome: 'Empresa ABC',
      },
      {
        itemCodigo: '7530110',
        estabelecimentoCodigo: '02',
        estabelecimentoNome: 'Empresa XYZ',
      },
    ];

    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

    mockRequest.query = { codigo: '7530110' };

    await ItemEmpresasController.getItemEmpresas(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 2,
        data: expect.objectContaining({
          codigo: '7530110',
        }),
      })
    );

    const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(responseData.data.empresas).toHaveLength(2);
    expect(responseData.data.empresas[0].codigo).toBe('01');
    expect(responseData.data.empresas[0].nome).toBe('Empresa ABC');
  });

  it('deve retornar array vazio quando item não tem empresas (fluxo completo)', async () => {
    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

    mockRequest.query = { codigo: 'INEXISTENTE' };

    await ItemEmpresasController.getItemEmpresas(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 0,
        data: expect.objectContaining({
          codigo: 'INEXISTENTE',
          empresas: [],
        }),
      })
    );
  });

  it('deve construir query SQL correta (fluxo completo)', async () => {
    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

    mockRequest.query = { codigo: 'TESTE123' };

    await ItemEmpresasController.getItemEmpresas(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const query = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0][0];
    expect(query).toContain("DECLARE @itemCodigo varchar(16) = 'TESTE123'");
    expect(query).toContain('PRD_EMS2EMP');
    expect(query).toContain('PRD_EMS2MULT');
    expect(query).toContain('EXEC sp_executesql');
  });

  it('deve propagar erro de banco (fluxo completo)', async () => {
    const dbError = new Error('Erro de conexão');
    (DatabaseManager.queryEmp as jest.Mock).mockRejectedValue(dbError);

    mockRequest.query = { codigo: '7530110' };

    await ItemEmpresasController.getItemEmpresas(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('deve fazer trim nos dados retornados (fluxo completo)', async () => {
    const mockDbData = [
      {
        itemCodigo: '7530110',
        estabelecimentoCodigo: '  01  ',
        estabelecimentoNome: '  Empresa ABC  ',
      },
    ];

    (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

    mockRequest.query = { codigo: '7530110' };

    await ItemEmpresasController.getItemEmpresas(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(responseData.data.empresas[0].codigo).toBe('01');
    expect(responseData.data.empresas[0].nome).toBe('Empresa ABC');
  });
});
