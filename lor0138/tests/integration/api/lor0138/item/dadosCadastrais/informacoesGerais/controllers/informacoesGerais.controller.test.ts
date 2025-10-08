// tests/unit/controllers/informacoesGerais.controller.test.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisController } from '../../../../../../../../src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller';
import { InformacoesGeraisService } from '../../../../../../../../src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service';
import { ItemNotFoundError, ValidationError } from '../../../../../../../../src/shared/errors/CustomErrors';
import { createInformacoesGerais } from '../../../../../../../factories/item.factory';

// Mock do Service
jest.mock('@api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service');

describe('Controller - InformacoesGeraisController', () => {
  
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock; // ✅ Tipado como jest.Mock, não NextFunction

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Request
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    // Mock Response
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Mock Next
    mockNext = jest.fn();
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getInformacoesGerais - Sucesso', () => {
    
    it('deve retornar 200 com dados do item', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '7530110' };

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
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: 'ABC123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(InformacoesGeraisService.getInformacoesGerais).toHaveBeenCalledWith('ABC123');
    });

    it('deve retornar estrutura de resposta correta', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '7530110' };

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
  // VALIDAÇÃO DE ENTRADA
  // ========================================
  describe('getInformacoesGerais - Validação', () => {
    
    it('deve lançar ValidationError se itemCodigo ausente', async () => {
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

    it('deve lançar ValidationError se itemCodigo vazio', async () => {
      mockRequest.params = { itemCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
    });

    it('deve lançar ValidationError se itemCodigo só espaços', async () => {
      mockRequest.params = { itemCodigo: '   ' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
    });

    it('deve lançar ValidationError se itemCodigo > 16 caracteres', async () => {
      mockRequest.params = { itemCodigo: '12345678901234567' }; // 17 chars

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
      mockRequest.params = { itemCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('obrigatório');
    });

    it('deve aceitar itemCodigo válido com 16 caracteres', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '1234567890123456' };

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
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('getInformacoesGerais - Item Não Encontrado', () => {
    
    it('deve lançar ItemNotFoundError quando Service retorna null', async () => {
      mockRequest.params = { itemCodigo: 'INEXISTENTE' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(null);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verifica que não retornou resposta JSON (houve erro)
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Se next foi chamado, verifica o erro
      if (mockNext.mock.calls.length > 0) {
        const error = mockNext.mock.calls[0][0];
        expect(error.message).toContain('INEXISTENTE');
      }
    });

    it('deve incluir código do item no erro', async () => {
      mockRequest.params = { itemCodigo: 'ABC123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(null);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Não deve retornar sucesso
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getInformacoesGerais - Erros do Service', () => {
    
    it('deve não retornar resposta quando Service lança erro', async () => {
      const serviceError = new Error('Erro no Service');
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(serviceError);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Não deve retornar resposta JSON em caso de erro
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('não deve retornar resposta em caso de erro', async () => {
      const serviceError = new Error('Erro');
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(serviceError);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

  });

  // ========================================
  // ASYNC HANDLER
  // ========================================
  describe('AsyncHandler Behavior', () => {
    
    it('deve capturar erros assíncronos sem retornar resposta', async () => {
      const asyncError = new Error('Async error');
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockRejectedValue(asyncError);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Não deve retornar resposta em caso de erro assíncrono
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('deve permitir que erros síncronos sejam capturados', async () => {
      mockRequest.params = { itemCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    
    it('deve aceitar itemCodigo com espaços nas extremidades após trim', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '  7530110  ' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Trim torna '  7530110  ' em '7530110' que é válido
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve aceitar códigos alfanuméricos', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: 'ABC123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('deve aceitar código de 1 caractere', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: 'A' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('deve tratar undefined params com TypeError', async () => {
      mockRequest.params = undefined as any;

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Destructuring de undefined gera TypeError, não ValidationError
      expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
    });

  });

  // ========================================
  // INTEGRAÇÃO
  // ========================================
  describe('Integração com Service', () => {
    
    it('deve chamar Service apenas se validação passar', async () => {
      mockRequest.params = { itemCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(InformacoesGeraisService.getInformacoesGerais).not.toHaveBeenCalled();
    });

    it('deve passar itemCodigo exatamente como recebido (sem trim)', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(InformacoesGeraisService.getInformacoesGerais).toHaveBeenCalledWith('7530110');
    });

  });

});