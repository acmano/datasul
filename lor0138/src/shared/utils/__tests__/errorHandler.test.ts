import { message } from 'antd';
import { AxiosError } from 'axios';
import logger from '../../services/logger.service';
import {
  getErrorMessage,
  getErrorType,
  normalizeError,
  showErrorMessage,
  logError,
  handleError,
  ErrorType,
} from '../errorHandler';

// Mock do logger
jest.mock('../../services/logger.service', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

// Mock do antd message
jest.mock('antd', () => ({
  message: {
    error: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
}));

describe('errorHandler', () => {
  const mockLoggerError = logger.error as jest.Mock;
  const mockMessageError = message.error as jest.Mock;
  const mockMessageWarning = message.warning as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getErrorMessage', () => {
    it('deve extrair mensagem de AxiosError com response', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Erro da API' },
          status: 400,
          statusText: 'Bad Request',
        },
      } as AxiosError;

      const msg = getErrorMessage(error);
      expect(msg).toBe('Erro da API');
    });

    it('deve usar statusText quando não há mensagem no response', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 404,
          statusText: 'Not Found',
        },
      } as AxiosError;

      const msg = getErrorMessage(error);
      expect(msg).toBe('Erro 404: Not Found');
    });

    it('deve retornar mensagem de erro de rede quando não há response', () => {
      const error = {
        isAxiosError: true,
        request: {},
      } as AxiosError;

      const msg = getErrorMessage(error);
      expect(msg).toBe('Erro de rede. Verifique sua conexão com a internet.');
    });

    it('deve extrair mensagem de Error padrão', () => {
      const error = new Error('Erro customizado');

      const msg = getErrorMessage(error);
      expect(msg).toBe('Erro customizado');
    });

    it('deve retornar string diretamente quando error é string', () => {
      const msg = getErrorMessage('Erro em string');
      expect(msg).toBe('Erro em string');
    });

    it('deve retornar mensagem padrão para erro desconhecido', () => {
      const msg = getErrorMessage({ unknown: 'object' });
      expect(msg).toBe('Erro desconhecido. Tente novamente.');
    });
  });

  describe('getErrorType', () => {
    it('deve retornar NETWORK para erro sem response', () => {
      const error = {
        isAxiosError: true,
        request: {},
      } as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('deve retornar AUTH para status 401', () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      } as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('deve retornar AUTH para status 403', () => {
      const error = {
        isAxiosError: true,
        response: { status: 403 },
      } as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('deve retornar VALIDATION para status 4xx', () => {
      const error = {
        isAxiosError: true,
        response: { status: 422 },
      } as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.VALIDATION);
    });

    it('deve retornar API para status 5xx', () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      } as AxiosError;

      expect(getErrorType(error)).toBe(ErrorType.API);
    });

    it('deve retornar UNKNOWN para erro não-axios', () => {
      const error = new Error('Erro genérico');

      expect(getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('normalizeError', () => {
    it('deve normalizar AxiosError com response completa', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad Request', details: { field: 'invalid' } },
        },
      } as AxiosError;

      const normalized = normalizeError(error);

      expect(normalized.type).toBe(ErrorType.VALIDATION);
      expect(normalized.message).toBe('Bad Request');
      expect(normalized.code).toBe(400);
      expect(normalized.details).toEqual({ message: 'Bad Request', details: { field: 'invalid' } });
    });

    it('deve normalizar Error simples', () => {
      const error = new Error('Simple error');

      const normalized = normalizeError(error);

      expect(normalized.type).toBe(ErrorType.UNKNOWN);
      expect(normalized.message).toBe('Simple error');
      expect(normalized.code).toBeUndefined();
    });
  });

  describe('showErrorMessage', () => {
    it('deve mostrar mensagem de erro padrão', () => {
      const error = new Error('Test error');

      showErrorMessage(error);

      expect(mockMessageError).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test error',
        })
      );
    });

    it('deve mostrar mensagem customizada quando fornecida', () => {
      const error = new Error('Original error');

      showErrorMessage(error, 'Custom message');

      expect(mockMessageError).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Custom message',
        })
      );
    });

    it('deve incluir correlationId na mensagem quando fornecido', () => {
      const error = new Error('Test error');
      const correlationId = '12345678-1234-1234-1234-123456789012';

      showErrorMessage(error, undefined, correlationId);

      expect(mockMessageError).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('(ID: 12345678...)'),
        })
      );
    });

    it('deve usar message.warning para erros de validação', () => {
      const error = {
        isAxiosError: true,
        response: { status: 422, data: { message: 'Validation failed' } },
      } as AxiosError;

      showErrorMessage(error);

      expect(mockMessageWarning).toHaveBeenCalled();
      expect(mockMessageError).not.toHaveBeenCalled();
    });

    it('deve adicionar onClick para copiar correlation ID', () => {
      const error = new Error('Test error');
      const correlationId = '12345678-1234-1234-1234-123456789012';

      showErrorMessage(error, undefined, correlationId);

      const callArgs = mockMessageError.mock.calls[0][0];
      expect(callArgs.onClick).toBeDefined();
      expect(callArgs.style).toEqual({ cursor: 'pointer' });
    });
  });

  describe('logError', () => {
    it('deve logar erro com logger service', () => {
      const error = new Error('Test error');

      logError(error, 'TestContext');

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          context: 'TestContext',
          errorType: ErrorType.UNKNOWN,
        })
      );
    });

    it('deve incluir code e details quando disponíveis', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Server Error', trace: 'stack trace' },
        },
      } as AxiosError;

      logError(error, 'APICall');

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Server Error',
        expect.objectContaining({
          context: 'APICall',
          code: 500,
          details: expect.objectContaining({ message: 'Server Error' }),
        })
      );
    });
  });

  describe('handleError', () => {
    it('deve logar e mostrar mensagem de erro', () => {
      const error = new Error('Complete test');

      handleError(error);

      expect(mockLoggerError).toHaveBeenCalled();
      expect(mockMessageError).toHaveBeenCalled();
    });

    it('deve usar contexto e mensagem customizada', () => {
      const error = new Error('Original error');

      handleError(error, {
        context: 'ComponentX',
        customMessage: 'Failed to load data',
      });

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Original error',
        expect.objectContaining({
          context: 'ComponentX',
        })
      );

      expect(mockMessageError).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Failed to load data',
        })
      );
    });

    it('não deve mostrar mensagem quando showMessage é false', () => {
      const error = new Error('Test error');

      handleError(error, { showMessage: false });

      expect(mockLoggerError).toHaveBeenCalled();
      expect(mockMessageError).not.toHaveBeenCalled();
    });

    it('deve retornar erro normalizado', () => {
      const error = new Error('Test error');

      const result = handleError(error, { showMessage: false });

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe('Test error');
    });

    it('deve passar correlationId para showErrorMessage', () => {
      const error = new Error('Test error');
      const correlationId = '12345678-1234-1234-1234-123456789012';

      handleError(error, { correlationId });

      expect(mockMessageError).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('(ID: 12345678...)'),
        })
      );
    });
  });
});
