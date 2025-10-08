// src/familia/dadosCadastrais/informacoesGerais/__tests__/controller.test.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisController } from '../controller';
import { InformacoesGeraisService } from '../service';
import { FamiliaNotFoundError, ValidationError } from '@shared/errors/CustomErrors';

jest.mock('../service');

describe('Controller - InformacoesGeraisController (Familia)', () => {
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

    it('deve retornar 200 com dados da família', async () => {
      const mockData = {
        codigo: 'F001',
        descricao: 'Válvulas e Conexões'
      };
      mockRequest.params = { familiaCodigo: 'F001' };

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
      const mockData = { codigo: 'FAM123', descricao: 'Test' };
      mockRequest.params = { familiaCodigo: 'FAM123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(InformacoesGeraisService.getInformacoesGerais).toHaveBeenCalledWith('FAM123');
    });

    it('deve retornar estrutura de resposta correta', async () => {
      const mockData = { codigo: 'F001', descricao: 'Test' };
      mockRequest.params = { familiaCodigo: 'F001' };

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

  });

  // ========================================
  // VALIDAÇÃO
  // ========================================
  describe('getInformacoesGerais - Validação', () => {

    it('deve lançar ValidationError se familiaCodigo ausente', async () => {
      mockRequest.params = {};

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
    });

    it('deve lançar ValidationError se familiaCodigo vazio', async () => {
      mockRequest.params = { familiaCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
    });

    it('deve lançar ValidationError se familiaCodigo só espaços', async () => {
      mockRequest.params = { familiaCodigo: '   ' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
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

    it('deve aceitar familiaCodigo válido com 8 caracteres', async () => {
      const codigo = '12345678';  
      const mockData = { codigo, descricao: 'Test' };
      mockRequest.params = { familiaCodigo: codigo };

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
  // FAMÍLIA NÃO ENCONTRADA
  // ========================================
  describe('getInformacoesGerais - Família Não Encontrada', () => {

    it('deve não retornar resposta quando Service lança FamiliaNotFoundError', async () => {
      mockRequest.params = { familiaCodigo: 'F001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock)
        .mockRejectedValue(new FamiliaNotFoundError('F001'));

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve não retornar resposta com família inexistente', async () => {
      mockRequest.params = { familiaCodigo: 'INEXISTENTE' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock)
        .mockRejectedValue(new FamiliaNotFoundError('INEXISTENTE'));

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

  });

  // ========================================
  // ERROS DO SERVICE
  // ========================================
  describe('getInformacoesGerais - Erros do Service', () => {

    it('deve não retornar resposta quando Service lança erro', async () => {
      mockRequest.params = { familiaCodigo: 'F001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock)
        .mockRejectedValue(new Error('Erro de banco'));

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('não deve retornar resposta em caso de erro', async () => {
      mockRequest.params = { familiaCodigo: 'F001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock)
        .mockRejectedValue(new FamiliaNotFoundError('F001'));

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

  });

  // ========================================
  // ASYNC HANDLER BEHAVIOR
  // ========================================
  describe('AsyncHandler Behavior', () => {

    it('deve não retornar resposta em caso de erro assíncrono', async () => {
      mockRequest.params = { familiaCodigo: 'F001' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock)
        .mockRejectedValue(new Error('Async error'));

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

  });

});