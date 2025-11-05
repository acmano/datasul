import { getErrorMessage, getErrorType, normalizeError, ErrorType } from './errorHandler';
import { AxiosError } from 'axios';

describe('errorHandler', () => {
  describe('getErrorMessage', () => {
    it('deve extrair mensagem de AxiosError com response', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Erro da API' },
          status: 400,
          statusText: 'Bad Request',
        },
      } as unknown as AxiosError;

      expect(getErrorMessage(error)).toBe('Erro da API');
    });

    it('deve retornar mensagem de erro de rede quando não há response', () => {
      const error = {
        isAxiosError: true,
        request: {},
      } as unknown as AxiosError;

      expect(getErrorMessage(error)).toBe('Erro de rede. Verifique sua conexão com a internet.');
    });

    it('deve extrair mensagem de Error padrão', () => {
      const error = new Error('Erro genérico');
      expect(getErrorMessage(error)).toBe('Erro genérico');
    });

    it('deve retornar string se erro for string', () => {
      expect(getErrorMessage('Erro customizado')).toBe('Erro customizado');
    });

    it('deve retornar mensagem padrão para erro desconhecido', () => {
      expect(getErrorMessage({})).toBe('Erro desconhecido. Tente novamente.');
    });
  });

  describe('getErrorType', () => {
    it('deve identificar erro de rede', () => {
      const error = {
        isAxiosError: true,
        request: {},
      } as unknown as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('deve identificar erro de autenticação (401)', () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      } as unknown as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('deve identificar erro de validação (400-499)', () => {
      const error = {
        isAxiosError: true,
        response: { status: 400 },
      } as unknown as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.VALIDATION);
    });

    it('deve identificar erro de API (500+)', () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      } as unknown as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.API);
    });

    it('deve retornar UNKNOWN para erros não classificados', () => {
      const error = new Error('Erro genérico');
      expect(getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('normalizeError', () => {
    it('deve normalizar AxiosError corretamente', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Erro de validação', details: { field: 'email' } },
        },
      } as unknown as AxiosError;

      const normalized = normalizeError(error);

      expect(normalized.type).toBe(ErrorType.VALIDATION);
      expect(normalized.message).toBe('Erro de validação');
      expect(normalized.code).toBe(400);
      expect(normalized.details).toEqual({
        message: 'Erro de validação',
        details: { field: 'email' },
      });
    });

    it('deve normalizar Error padrão', () => {
      const error = new Error('Erro genérico');
      const normalized = normalizeError(error);

      expect(normalized.type).toBe(ErrorType.UNKNOWN);
      expect(normalized.message).toBe('Erro genérico');
      expect(normalized.code).toBeUndefined();
    });
  });
});
