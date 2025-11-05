// src/deposito/listar/__tests__/controller.test.ts

import { Request, Response } from 'express';
import { ListarController } from '../controller';
import { ListarService } from '../service';

jest.mock('../service');

describe('Controller - ListarController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('listarTodos', () => {
    it('deve retornar lista de depósitos com sucesso', async () => {
      const mockDepositos = [
        {
          codigo: '01',
          nome: 'DEPOSITO CENTRAL',
          consideraSaldoDisponivel: 'Sim',
          consideraSaldoAlocado: 'Sim',
          permissaoMovDeposito1: 'E',
          permissaoMovDeposito2: 'S',
          permissaoMovDeposito3: 'T',
          produtoAcabado: 'Sim',
          tipoDeposito: 'Interno',
          depositoProcesso: 'Não',
          nomeAbrev: 'DEP CENTRAL',
          saldoDisponivel: 'Sim',
          depositoCQ: 'Não',
          depositoRejeito: 'Não',
          char1: '',
          char2: '',
          dec1: 0,
          dec2: 0,
          int1: 0,
          int2: 0,
          log1: false,
          log2: false,
          data1: null,
          data2: null,
          checkSum: '',
          depositoReciclado: 'Não',
          consideraOrdens: 'Sim',
          depositoWMS: 'Não',
          alocaSaldoERP: 'Sim',
          origemExterna: 'Não',
          depositoWmsExterno: 'Não',
          alocaSaldoWmsExterno: 'Não',
        },
      ];

      (ListarService.listarTodos as jest.Mock).mockResolvedValue(mockDepositos);

      await ListarController.listarTodos(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDepositos,
        total: 1,
      });
    });

    it('deve retornar array vazio quando nenhum depósito encontrado', async () => {
      (ListarService.listarTodos as jest.Mock).mockResolvedValue([]);

      await ListarController.listarTodos(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        total: 0,
      });
    });
  });
});
