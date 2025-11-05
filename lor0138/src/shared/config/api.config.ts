import axios, { AxiosError, AxiosResponse } from 'axios';
import logger from '../services/logger.service';
import { env } from '../utils/env';

/**
 * Configuração da API Axios
 *
 * Features:
 * - Base URL configurável via env
 * - Timeout de 30s
 * - Interceptor de autenticação (request)
 * - Interceptor de Correlation ID (response)
 * - Tratamento de erro 401 (redirect login)
 */
const api = axios.create({
  baseURL: env.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// CORRELATION ID HANDLER
// ============================================================================

/**
 * Callback global para capturar Correlation ID
 * Será definido pelo CorrelationProvider através de setGlobalCorrelationIdHandler
 */
let globalCorrelationIdHandler: ((id: string) => void) | null = null;

/**
 * Define o handler global de Correlation ID
 * Chamado pelo CorrelationProvider na inicialização
 *
 * @param handler - Função que recebe o Correlation ID
 */
export const setGlobalCorrelationIdHandler = (handler: (id: string) => void): void => {
  globalCorrelationIdHandler = handler;
};

// ============================================================================
// RATE LIMIT HANDLERS
// ============================================================================

/**
 * Callback global para atualizar informações de rate limit
 * Será definido pelo RateLimitProvider
 */
let globalRateLimitHeadersHandler: ((headers: Record<string, string>) => void) | null = null;

/**
 * Callback global para tratar erro 429 (rate limit)
 * Será definido pelo RateLimitProvider
 */
let globalRateLimitErrorHandler:
  | ((headers: Record<string, string>, error: AxiosError) => void)
  | null = null;

/**
 * Define o handler global de headers de rate limit
 * Chamado pelo RateLimitProvider na inicialização
 *
 * @param handler - Função que recebe os headers da resposta
 */
export const setGlobalRateLimitHeadersHandler = (
  handler: (headers: Record<string, string>) => void
): void => {
  globalRateLimitHeadersHandler = handler;
};

/**
 * Define o handler global de erro de rate limit
 * Chamado pelo RateLimitProvider na inicialização
 *
 * @param handler - Função que recebe headers e erro quando 429 ocorre
 */
export const setGlobalRateLimitErrorHandler = (
  handler: (headers: Record<string, string>, error: AxiosError) => void
): void => {
  globalRateLimitErrorHandler = handler;
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Interceptor de requisição
 * - Adiciona token de autenticação se disponível
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Interceptor de resposta
 * - Captura X-Correlation-ID do header e atualiza contexto
 * - Captura headers de Rate Limit (X-RateLimit-*)
 * - Trata erro 401 (redirect para login)
 * - Trata erro 429 (rate limit)
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Captura Correlation ID do header de resposta
    const correlationId = response.headers['x-correlation-id'];

    if (correlationId && globalCorrelationIdHandler) {
      globalCorrelationIdHandler(correlationId);
    }

    // Captura headers de Rate Limit
    if (globalRateLimitHeadersHandler) {
      const headers: Record<string, string> = {};

      // Extrai headers de rate limit (case-insensitive)
      const lowerHeaders = Object.keys(response.headers).reduce(
        (acc, key) => {
          acc[key.toLowerCase()] = response.headers[key];
          return acc;
        },
        {} as Record<string, string>
      );

      if (lowerHeaders['x-ratelimit-limit']) {
        headers['x-ratelimit-limit'] = lowerHeaders['x-ratelimit-limit'];
      }
      if (lowerHeaders['x-ratelimit-remaining']) {
        headers['x-ratelimit-remaining'] = lowerHeaders['x-ratelimit-remaining'];
      }
      if (lowerHeaders['x-ratelimit-reset']) {
        headers['x-ratelimit-reset'] = lowerHeaders['x-ratelimit-reset'];
      }

      // Atualiza contexto se houver algum header
      if (Object.keys(headers).length > 0) {
        globalRateLimitHeadersHandler(headers);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    // Captura Correlation ID mesmo em caso de erro
    const correlationId = error.response?.headers['x-correlation-id'];

    if (correlationId && globalCorrelationIdHandler) {
      globalCorrelationIdHandler(correlationId);
    }

    // Log de erro de API para sistema centralizado
    const responseData = error.response?.data as any;
    const errorMessage = responseData?.message || error.message || 'API request failed';
    const statusCode = error.response?.status;

    logger.error(
      `API Error: ${errorMessage}`,
      {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        statusCode,
        errorCode: error.code,
        responseData: responseData,
      },
      correlationId || undefined
    );

    // Tratamento de erro 429 (rate limit)
    if (error.response?.status === 429 && globalRateLimitErrorHandler) {
      const headers: Record<string, string> = {};

      // Extrai headers de rate limit (case-insensitive)
      const responseHeaders = error.response.headers;
      const lowerHeaders = Object.keys(responseHeaders).reduce(
        (acc, key) => {
          acc[key.toLowerCase()] = responseHeaders[key];
          return acc;
        },
        {} as Record<string, string>
      );

      // Headers específicos de rate limit
      if (lowerHeaders['retry-after']) {
        headers['retry-after'] = lowerHeaders['retry-after'];
      }
      if (lowerHeaders['x-ratelimit-limit']) {
        headers['x-ratelimit-limit'] = lowerHeaders['x-ratelimit-limit'];
      }
      if (lowerHeaders['x-ratelimit-remaining']) {
        headers['x-ratelimit-remaining'] = lowerHeaders['x-ratelimit-remaining'];
      }
      if (lowerHeaders['x-ratelimit-reset']) {
        headers['x-ratelimit-reset'] = lowerHeaders['x-ratelimit-reset'];
      }

      // Chama handler de rate limit
      globalRateLimitErrorHandler(headers, error);
    }

    // Tratamento de erro 401 (não autorizado)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
