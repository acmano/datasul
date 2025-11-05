import { message } from 'antd';
import { isAxiosError } from 'axios';
import logger from '../services/logger.service';

/**
 * Tipos de erro da aplicação
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Interface para erro padronizado
 */
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: unknown;
}

/**
 * Extrai mensagem de erro amigável de diferentes tipos de erro
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.response) {
      return (
        error.response.data?.message ||
        error.response.data?.error ||
        `Erro ${error.response.status}: ${error.response.statusText}`
      );
    }
    if (error.request) {
      return 'Erro de rede. Verifique sua conexão com a internet.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Erro desconhecido. Tente novamente.';
};

/**
 * Determina o tipo de erro
 */
export const getErrorType = (error: unknown): ErrorType => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return ErrorType.NETWORK;
    }
    if (error.response.status === 401 || error.response.status === 403) {
      return ErrorType.AUTH;
    }
    if (error.response.status >= 400 && error.response.status < 500) {
      return ErrorType.VALIDATION;
    }
    return ErrorType.API;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Converte erro desconhecido em AppError padronizado
 */
export const normalizeError = (error: unknown): AppError => {
  const type = getErrorType(error);
  const message = getErrorMessage(error);

  let code: string | number | undefined;
  let details: unknown;

  if (isAxiosError(error) && error.response) {
    code = error.response.status;
    details = error.response.data;
  }

  return {
    type,
    message,
    code,
    details,
  };
};

/**
 * Exibe mensagem de erro ao usuário via Ant Design message
 * Inclui Correlation ID quando disponível
 *
 * @param error - Erro a ser exibido
 * @param customMessage - Mensagem customizada (opcional)
 * @param correlationId - ID de correlação para troubleshooting (opcional)
 */
export const showErrorMessage = (
  error: unknown,
  customMessage?: string,
  correlationId?: string | null
): void => {
  const appError = normalizeError(error);

  let displayMessage = customMessage || appError.message;

  // Adiciona Correlation ID à mensagem se disponível
  if (correlationId) {
    displayMessage = `${displayMessage} (ID: ${correlationId.substring(0, 8)}...)`;
  }

  const messageConfig = {
    content: displayMessage,
    onClick: correlationId
      ? () => {
          navigator.clipboard
            .writeText(correlationId)
            .then(() => {
              message.success('ID de rastreamento copiado!');
            })
            .catch(() => {
              // Fallback silencioso
            });
        }
      : undefined,
    style: correlationId
      ? {
          cursor: 'pointer',
        }
      : undefined,
  };

  switch (appError.type) {
    case ErrorType.AUTH:
      message.error({
        ...messageConfig,
        duration: 5,
      });
      break;

    case ErrorType.NETWORK:
      message.error({
        ...messageConfig,
        duration: 7,
      });
      break;

    case ErrorType.VALIDATION:
      message.warning({
        ...messageConfig,
        duration: 4,
      });
      break;

    default:
      message.error({
        ...messageConfig,
        duration: 5,
      });
  }
};

/**
 * Log de erro para debugging (console em dev, serviço externo em prod)
 */
export const logError = (error: unknown, context?: string): void => {
  const appError = normalizeError(error);

  const logData = {
    timestamp: new Date().toISOString(),
    context,
    ...appError,
  };

  // Em desenvolvimento, log no console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', logData);
  }

  // Envia para sistema de logging centralizado
  logger.error(appError.message, {
    context,
    errorType: appError.type,
    code: appError.code,
    details: appError.details,
  });
};

/**
 * Handler completo de erro: log + exibição de mensagem
 */
export const handleError = (
  error: unknown,
  options?: {
    context?: string;
    customMessage?: string;
    showMessage?: boolean;
    correlationId?: string | null;
  }
): AppError => {
  const {
    context,
    customMessage,
    showMessage: shouldShowMessage = true,
    correlationId,
  } = options || {};

  // Log do erro
  logError(error, context);

  // Exibir mensagem ao usuário
  if (shouldShowMessage) {
    showErrorMessage(error, customMessage, correlationId);
  }

  // Retornar erro normalizado
  return normalizeError(error);
};

/**
 * Wrapper para chamadas assíncronas com tratamento de erro
 */
export const withErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  options?: {
    context?: string;
    customMessage?: string;
    onError?: (error: AppError) => void;
  }
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = handleError(error, {
      context: options?.context,
      customMessage: options?.customMessage,
    });

    if (options?.onError) {
      options.onError(appError);
    }

    return null;
  }
};
