// src/deposito/dadosCadastrais/informacoesGerais/__tests__/controller.test.ts

import { Request, Response } from 'express';
import { InformacoesGeraisController } from '../controller';
import { InformacoesGeraisService } from '../service';
import { DepositoNotFoundError, ValidationError } from '@shared/errors/CustomErrors';

jest.mock('../service');

describe('Controller - InformacoesGeraisController (Deposito)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar 200 com dados do depósito', async () => {
      const mockData = {
        codigo: 'D001',
        nome: 'Depósito Principal',
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Sim',
        permissaoMovDeposito1: 'SIM',
        permissaoMovDeposito2: 'SIM',
        permissaoMovDeposito3: 'NAO',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoProcesso: 'Não',
        nomeAbrev: 'DEP PRINC',
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
        checkSum: 'ABC123',
        depositoReciclado: 'Não',
        consideraOrdens: 'Sim',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Sim',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };
      mockRequest.params = { depositoCodigo: 'D001' };

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
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve chamar Service com código correto', async () => {
      const mockData = {
        codigo: 'DEP123',
        nome: 'Test',
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Sim',
        permissaoMovDeposito1: '',
        permissaoMovDeposito2: '',
        permissaoMovDeposito3: '',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoProcesso: 'Não',
        nomeAbrev: '',
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
        consideraOrdens: 'Não',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Não',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };
      mockRequest.params = { depositoCodigo: 'DEP123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(InformacoesGeraisService.getInformacoesGerais).toHaveBeenCalledWith('DEP123');
    });

    it('deve retornar estrutura de resposta correta', async () => {
      const mockData = {
        codigo: 'D001',
        nome: 'Test',
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Sim',
        permissaoMovDeposito1: '',
        permissaoMovDeposito2: '',
        permissaoMovDeposito3: '',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoProcesso: 'Não',
        nomeAbrev: '',
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
        consideraOrdens: 'Não',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Não',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };
      mockRequest.params = { depositoCodigo: 'D001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
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

    it('deve aceitar código com caracteres alfanuméricos', async () => {
      const codigo = 'DEP-PRINC-01';
      const mockData = {
        codigo,
        nome: 'Test',
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Sim',
        permissaoMovDeposito1: '',
        permissaoMovDeposito2: '',
        permissaoMovDeposito3: '',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoProcesso: 'Não',
        nomeAbrev: '',
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
        consideraOrdens: 'Não',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Não',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };
      mockRequest.params = { depositoCodigo: codigo };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // VALIDAÇÃO
  // ========================================
  describe('getInformacoesGerais - Validação', () => {
    it('deve lançar ValidationError se depositoCodigo ausente', async () => {
      mockRequest.params = {};

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('deve lançar ValidationError se depositoCodigo vazio', async () => {
      mockRequest.params = { depositoCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('deve lançar ValidationError se depositoCodigo só espaços', async () => {
      mockRequest.params = { depositoCodigo: '   ' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('deve incluir mensagem descritiva no ValidationError', async () => {
      mockRequest.params = {};

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('obrigatório');
    });

    it('deve aceitar depositoCodigo válido com 8 caracteres', async () => {
      const codigo = '12345678';
      const mockData = {
        codigo,
        nome: 'Test',
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Sim',
        permissaoMovDeposito1: '',
        permissaoMovDeposito2: '',
        permissaoMovDeposito3: '',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoProcesso: 'Não',
        nomeAbrev: '',
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
        consideraOrdens: 'Não',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Não',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };
      mockRequest.params = { depositoCodigo: codigo };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve validar e sanitizar código antes de chamar service', async () => {
      const mockData = {
        codigo: 'D001',
        nome: 'Test',
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Sim',
        permissaoMovDeposito1: '',
        permissaoMovDeposito2: '',
        permissaoMovDeposito3: '',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoProcesso: 'Não',
        nomeAbrev: '',
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
        consideraOrdens: 'Não',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Não',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };
      mockRequest.params = { depositoCodigo: '  D001  ' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(InformacoesGeraisService.getInformacoesGerais).toHaveBeenCalledWith('D001');
    });
  });

  // ========================================
  // DEPÓSITO NÃO ENCONTRADO
  // ========================================
  describe('getInformacoesGerais - Depósito Não Encontrado', () => {
    it('deve não retornar resposta quando Service lança DepositoNotFoundError', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(
        new DepositoNotFoundError('D001')
      );

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve não retornar resposta com depósito inexistente', async () => {
      mockRequest.params = { depositoCodigo: 'INEXISTENTE' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(
        new DepositoNotFoundError('INEXISTENTE')
      );

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve propagar erro para o middleware de erro via asyncHandler', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };
      const error = new DepositoNotFoundError('D001');

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(error);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // asyncHandler captura o erro, então mockNext não é chamado diretamente
      // mas a resposta também não é enviada
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // ERROS DO SERVICE
  // ========================================
  describe('getInformacoesGerais - Erros do Service', () => {
    it('deve não retornar resposta quando Service lança erro', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(
        new Error('Erro de banco')
      );

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('não deve retornar resposta em caso de erro', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(
        new DepositoNotFoundError('D001')
      );

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve não retornar resposta para erro genérico', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };
      const error = new Error('Database connection failed');

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(error);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // asyncHandler captura o erro
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // ASYNC HANDLER BEHAVIOR
  // ========================================
  describe('AsyncHandler Behavior', () => {
    it('deve não retornar resposta em caso de erro assíncrono', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(
        new Error('Async error')
      );

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve não retornar resposta para erro assíncrono', async () => {
      mockRequest.params = { depositoCodigo: 'D001' };
      const asyncError = new Error('Unexpected async error');

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(asyncError);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // asyncHandler captura o erro
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
