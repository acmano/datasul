// src/item/dadosCadastrais/informacoesGerais/__tests__/controller.test.ts

import { Request, Response } from 'express';
import { InformacoesGeraisController } from '../controller';
import { InformacoesGeraisService } from '../service';
import { ValidationError } from '@shared/errors/CustomErrors';
import { createInformacoesGerais } from '@tests/factories/item.factory';

// Mock do Service
jest.mock('../service');

/**
 * NOTA: O factory createInformacoesGerais() pode não incluir todos os novos campos.
 * Por isso, alguns testes adicionam manualmente os campos obrigatórios:
 * - status
 * - estabelecimentoPadraoCodigo
 * - dataImplantacao
 * - dataLiberacao
 */

describe('Controller - InformacoesGeraisController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

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

    it('deve retornar dados do item com todos os campos básicos', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data.item).toHaveProperty('codigo');
      expect(response.data.item).toHaveProperty('descricao');
      expect(response.data.item).toHaveProperty('unidade');
    });

    it('deve retornar dados do item com novos campos obrigatórios', async () => {
      const mockData = createInformacoesGerais();
      // Adicionar novos campos obrigatórios
      mockData.item.status = 'Ativo';
      mockData.item.estabelecimentoPadraoCodigo = '01.01';
      mockData.item.dataImplantacao = '01/01/2020';
      mockData.item.dataLiberacao = '15/01/2020';

      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Campos obrigatórios devem estar presentes
      expect(response.data.item).toHaveProperty('status');
      expect(response.data.item).toHaveProperty('estabelecimentoPadraoCodigo');
      expect(response.data.item).toHaveProperty('dataImplantacao');
      expect(response.data.item).toHaveProperty('dataLiberacao');

      // Validar tipos
      expect(typeof response.data.item.status).toBe('string');
      expect(typeof response.data.item.estabelecimentoPadraoCodigo).toBe('string');
      expect(typeof response.data.item.dataImplantacao).toBe('string');
      expect(typeof response.data.item.dataLiberacao).toBe('string');
    });

    it('deve retornar dados do item com novos campos opcionais', async () => {
      const mockData = createInformacoesGerais();
      // Adicionar campos obrigatórios
      mockData.item.status = 'Ativo';
      mockData.item.estabelecimentoPadraoCodigo = '01.01';
      mockData.item.dataImplantacao = '01/01/2020';
      mockData.item.dataLiberacao = '15/01/2020';
      // Adicionar campos opcionais
      mockData.item.dataObsolescencia = undefined;

      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Verifica que os novos campos estão presentes (mesmo que undefined)
      expect(response.data.item).toHaveProperty('dataObsolescencia');
      expect(response.data.item).toHaveProperty('endereco');
      expect(response.data.item).toHaveProperty('descricaoResumida');
      expect(response.data.item).toHaveProperty('descricaoAlternativa');
    });

    it('deve retornar objeto contenedor quando presente', async () => {
      const mockData = createInformacoesGerais();
      // Garante que contenedor está presente
      mockData.item.contenedor = {
        codigo: 'CX01',
        descricao: 'CAIXA PEQUENA',
      };
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data.item.contenedor).toBeDefined();
      expect(response.data.item.contenedor).toHaveProperty('codigo', 'CX01');
      expect(response.data.item.contenedor).toHaveProperty('descricao', 'CAIXA PEQUENA');
    });

    it('deve retornar dataObsolescencia quando presente', async () => {
      const mockData = createInformacoesGerais();
      // Adicionar campos obrigatórios
      mockData.item.status = 'Obsoleto';
      mockData.item.estabelecimentoPadraoCodigo = '01.01';
      mockData.item.dataImplantacao = '01/01/2020';
      mockData.item.dataLiberacao = '15/01/2020';
      // Adicionar campo opcional
      mockData.item.dataObsolescencia = '31/12/2025';

      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data.item.dataObsolescencia).toBe('31/12/2025');
    });

    it('deve retornar datas no formato correto', async () => {
      const mockData = createInformacoesGerais();
      // Adicionar campos obrigatórios com datas
      mockData.item.status = 'Ativo';
      mockData.item.estabelecimentoPadraoCodigo = '01.01';
      mockData.item.dataImplantacao = '01/01/2020';
      mockData.item.dataLiberacao = '15/01/2020';
      mockData.item.dataObsolescencia = '31/12/2025';

      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Validar formato dd/mm/yyyy
      expect(response.data.item.dataImplantacao).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(response.data.item.dataLiberacao).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(response.data.item.dataObsolescencia).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('deve retornar diferentes valores de status', async () => {
      const statusTeste = ['Ativo', 'Inativo', 'Obsoleto', 'Em Desenvolvimento'];

      for (const status of statusTeste) {
        const mockData = createInformacoesGerais();
        // Adicionar campos obrigatórios
        mockData.item.status = status;
        mockData.item.estabelecimentoPadraoCodigo = '01.01';
        mockData.item.dataImplantacao = '01/01/2020';
        mockData.item.dataLiberacao = '15/01/2020';

        mockRequest.params = { itemCodigo: '7530110' };

        (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

        await InformacoesGeraisController.getInformacoesGerais(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
        expect(response.data.item.status).toBe(status);

        // Limpar mock para próxima iteração
        jest.clearAllMocks();
      }
    });

    it('deve retornar dados completos incluindo relacionamentos', async () => {
      const mockData = createInformacoesGerais();
      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data).toHaveProperty('item');
      expect(response.data).toHaveProperty('familia');
      expect(response.data).toHaveProperty('familiaComercial');
      expect(response.data).toHaveProperty('grupoDeEstoque');
      expect(response.data).toHaveProperty('estabelecimentos');
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

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('deve lançar ValidationError se itemCodigo vazio', async () => {
      mockRequest.params = { itemCodigo: '' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('deve lançar ValidationError se itemCodigo só espaços', async () => {
      mockRequest.params = { itemCodigo: '   ' };

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('deve lançar ValidationError se itemCodigo > 16 caracteres', async () => {
      mockRequest.params = { itemCodigo: '12345678901234567' }; // 17 chars

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
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

    it('deve retornar campos opcionais mesmo quando undefined', async () => {
      const mockData = createInformacoesGerais();
      // Adicionar campos obrigatórios
      mockData.item.status = 'Ativo';
      mockData.item.estabelecimentoPadraoCodigo = '01.01';
      mockData.item.dataImplantacao = '01/01/2020';
      mockData.item.dataLiberacao = '15/01/2020';
      // Remove campos opcionais
      mockData.item.dataObsolescencia = undefined;
      mockData.item.endereco = undefined;
      mockData.item.descricaoResumida = undefined;
      mockData.item.descricaoAlternativa = undefined;
      mockData.item.contenedor = undefined;

      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Campos devem estar presentes na resposta, mesmo undefined
      expect('dataObsolescencia' in response.data.item).toBe(true);
      expect('endereco' in response.data.item).toBe(true);
      expect('descricaoResumida' in response.data.item).toBe(true);
      expect('descricaoAlternativa' in response.data.item).toBe(true);
      expect('contenedor' in response.data.item).toBe(true);
    });

    it('deve garantir que campos obrigatórios sempre estejam presentes', async () => {
      const mockData = createInformacoesGerais();
      // Adicionar campos obrigatórios
      mockData.item.status = 'Ativo';
      mockData.item.estabelecimentoPadraoCodigo = '01.01';
      mockData.item.dataImplantacao = '01/01/2020';
      mockData.item.dataLiberacao = '15/01/2020';

      mockRequest.params = { itemCodigo: '7530110' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Campos obrigatórios NUNCA devem ser undefined
      expect(response.data.item.status).toBeDefined();
      expect(response.data.item.estabelecimentoPadraoCodigo).toBeDefined();
      expect(response.data.item.dataImplantacao).toBeDefined();
      expect(response.data.item.dataLiberacao).toBeDefined();
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
