import React, { useEffect, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';
import RateLimitWarning from './RateLimitWarning';
import { useRateLimit } from '../contexts/RateLimitContext';
import { useCountdown } from '../hooks/useCountdown';

/**
 * Container do RateLimitWarning
 *
 * Conecta o componente de UI com o contexto de Rate Limit.
 * Gerencia:
 * - Estado de countdown
 * - Lógica de retry (refaz última request)
 * - Sincronização entre contexto e UI
 *
 * Este componente deve ser renderizado uma única vez na aplicação,
 * preferencialmente no App.tsx logo após os providers.
 *
 * @example
 * ```tsx
 * // No App.tsx
 * <RateLimitProvider>
 *   <RateLimitWarningContainer />
 *   <YourApp />
 * </RateLimitProvider>
 * ```
 */
const RateLimitWarningContainer: React.FC = () => {
  const { isRateLimited, retryAfter, clearRateLimit, lastError } = useRateLimit();
  const { seconds, isFinished, restart } = useCountdown(retryAfter || 0);

  // Ref para armazenar última request falhada (para retry)
  const lastFailedRequestRef = useRef<AxiosError | null>(null);

  /**
   * Atualiza ref quando erro muda
   */
  useEffect(() => {
    if (lastError && lastError instanceof Error) {
      lastFailedRequestRef.current = lastError as AxiosError;
    }
  }, [lastError]);

  /**
   * Reinicia countdown quando retryAfter muda
   */
  useEffect(() => {
    if (retryAfter !== null && retryAfter > 0) {
      restart(retryAfter);
    }
  }, [retryAfter, restart]);

  /**
   * Handler de retry
   *
   * Por enquanto apenas limpa o estado de rate limit.
   * O usuário terá que manualmente refazer a ação que causou o erro.
   *
   * TODO: Implementar retry automático da última request se necessário
   */
  const handleRetry = useCallback(() => {
    // Limpa o estado de rate limit
    clearRateLimit();

    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[RateLimitWarningContainer] Retry iniciado pelo usuário');

      if (lastFailedRequestRef.current) {
        // eslint-disable-next-line no-console
        console.log('[RateLimitWarningContainer] Última request:', {
          url: lastFailedRequestRef.current.config?.url,
          method: lastFailedRequestRef.current.config?.method,
        });
      }
    }

    // Limpa ref
    lastFailedRequestRef.current = null;
  }, [clearRateLimit]);

  /**
   * Handler de close
   */
  const handleClose = useCallback(() => {
    clearRateLimit();
    lastFailedRequestRef.current = null;
  }, [clearRateLimit]);

  return (
    <RateLimitWarning
      isVisible={isRateLimited}
      retryAfter={isFinished ? 0 : seconds}
      onRetry={handleRetry}
      onClose={handleClose}
    />
  );
};

export default RateLimitWarningContainer;
