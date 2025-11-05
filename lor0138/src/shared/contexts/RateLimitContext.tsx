import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { AxiosError } from 'axios';
import {
  setGlobalRateLimitHeadersHandler,
  setGlobalRateLimitErrorHandler,
} from '../config/api.config';

/**
 * Estado de Rate Limit
 *
 * Mantém informações sobre o estado atual de limitação de requisições
 */
export interface RateLimitState {
  /**
   * Indica se está atualmente limitado (erro 429 ativo)
   */
  isRateLimited: boolean;

  /**
   * Segundos até poder tentar novamente
   */
  retryAfter: number | null;

  /**
   * Limite total de requests permitidos
   */
  limit: number | null;

  /**
   * Número de requests restantes
   */
  remaining: number | null;

  /**
   * Timestamp (em segundos) de quando o limite será resetado
   */
  reset: number | null;

  /**
   * Último erro de rate limit
   */
  lastError: Error | null;
}

/**
 * Interface do contexto de Rate Limit
 */
export interface RateLimitContextType extends RateLimitState {
  /**
   * Define o estado de rate limit quando erro 429 ocorre
   *
   * @param headers - Headers da resposta HTTP com informações de rate limit
   * @param error - Erro original do Axios
   */
  setRateLimitError: (headers: Record<string, string>, error: AxiosError) => void;

  /**
   * Limpa o estado de rate limit (após retry bem-sucedido)
   */
  clearRateLimit: () => void;

  /**
   * Atualiza informações de rate limit de qualquer resposta bem-sucedida
   *
   * @param headers - Headers da resposta HTTP
   */
  updateFromHeaders: (headers: Record<string, string>) => void;
}

/**
 * Context do Rate Limit
 */
export const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

interface RateLimitProviderProps {
  children: ReactNode;
}

/**
 * Estado inicial do Rate Limit
 */
const initialState: RateLimitState = {
  isRateLimited: false,
  retryAfter: null,
  limit: null,
  remaining: null,
  reset: null,
  lastError: null,
};

/**
 * Provider do Rate Limit Context
 *
 * Mantém o estado de rate limiting da API, incluindo:
 * - Status de limitação ativa (429)
 * - Informações de uso (limite, restante, reset)
 * - Tempo de espera para retry
 *
 * Este contexto é atualizado automaticamente pelos interceptors do Axios.
 *
 * @example
 * ```tsx
 * // No index.tsx ou App.tsx
 * <RateLimitProvider>
 *   <YourApp />
 * </RateLimitProvider>
 * ```
 */
export const RateLimitProvider: React.FC<RateLimitProviderProps> = ({ children }) => {
  const [state, setState] = useState<RateLimitState>(initialState);

  /**
   * Extrai valor numérico de header
   */
  const parseHeaderNumber = useCallback((value: string | undefined): number | null => {
    if (!value) {
      return null;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }, []);

  /**
   * Define erro de rate limit
   */
  const setRateLimitError = useCallback(
    (headers: Record<string, string>, error: AxiosError) => {
      const retryAfter = parseHeaderNumber(headers['retry-after']);
      const limit = parseHeaderNumber(headers['x-ratelimit-limit']);
      const remaining = parseHeaderNumber(headers['x-ratelimit-remaining']);
      const reset = parseHeaderNumber(headers['x-ratelimit-reset']);

      setState({
        isRateLimited: true,
        retryAfter,
        limit,
        remaining,
        reset,
        lastError: error as Error,
      });

      // Log em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[RateLimitContext] Rate limit atingido:', {
          retryAfter,
          limit,
          remaining,
          reset,
          error: error.message,
        });
      }
    },
    [parseHeaderNumber]
  );

  /**
   * Limpa estado de rate limit
   */
  const clearRateLimit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRateLimited: false,
      retryAfter: null,
      lastError: null,
    }));

    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[RateLimitContext] Rate limit limpo');
    }
  }, []);

  /**
   * Atualiza informações de rate limit de resposta bem-sucedida
   */
  const updateFromHeaders = useCallback(
    (headers: Record<string, string>) => {
      const limit = parseHeaderNumber(headers['x-ratelimit-limit']);
      const remaining = parseHeaderNumber(headers['x-ratelimit-remaining']);
      const reset = parseHeaderNumber(headers['x-ratelimit-reset']);

      // Só atualiza se houver pelo menos um header de rate limit
      if (limit !== null || remaining !== null || reset !== null) {
        setState((prev) => ({
          ...prev,
          limit: limit !== null ? limit : prev.limit,
          remaining: remaining !== null ? remaining : prev.remaining,
          reset: reset !== null ? reset : prev.reset,
        }));

        // Log em desenvolvimento (apenas quando há mudança significativa)
        if (process.env.NODE_ENV === 'development' && remaining !== null && remaining < 20) {
          // eslint-disable-next-line no-console
          console.warn('[RateLimitContext] Poucos requests restantes:', remaining);
        }
      }
    },
    [parseHeaderNumber]
  );

  /**
   * Registra handlers globais no interceptor do Axios
   * Isso permite que o interceptor atualize o contexto automaticamente
   */
  useEffect(() => {
    setGlobalRateLimitHeadersHandler(updateFromHeaders);
    setGlobalRateLimitErrorHandler(setRateLimitError);

    // Cleanup: remove handlers ao desmontar
    return () => {
      setGlobalRateLimitHeadersHandler(() => {});
      setGlobalRateLimitErrorHandler(() => {});
    };
  }, [updateFromHeaders, setRateLimitError]);

  const value: RateLimitContextType = {
    ...state,
    setRateLimitError,
    clearRateLimit,
    updateFromHeaders,
  };

  return <RateLimitContext.Provider value={value}>{children}</RateLimitContext.Provider>;
};

/**
 * Hook para acessar o contexto de Rate Limit
 *
 * @throws Error se usado fora do RateLimitProvider
 *
 * @example
 * ```tsx
 * const { isRateLimited, retryAfter, clearRateLimit } = useRateLimit();
 *
 * if (isRateLimited) {
 *   return <div>Aguarde {retryAfter} segundos</div>;
 * }
 * ```
 */
export const useRateLimit = (): RateLimitContextType => {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit deve ser usado dentro de um RateLimitProvider');
  }
  return context;
};
