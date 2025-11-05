import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { setGlobalCorrelationIdHandler } from '../config/api.config';

/**
 * Interface do contexto de Correlation ID
 * Permite rastrear requisições end-to-end através do sistema
 */
export interface CorrelationContextType {
  /**
   * ID de correlação atual (null se nenhuma requisição foi feita ainda)
   */
  correlationId: string | null;

  /**
   * Define o ID de correlação
   * @param id - ID de correlação recebido do backend
   */
  setCorrelationId: (id: string) => void;

  /**
   * Limpa o ID de correlação
   */
  clearCorrelationId: () => void;
}

/**
 * Context do Correlation ID
 */
export const CorrelationContext = createContext<CorrelationContextType | undefined>(undefined);

interface CorrelationProviderProps {
  children: ReactNode;
}

/**
 * Provider do Correlation Context
 *
 * Mantém o último Correlation ID conhecido para troubleshooting.
 * Este ID é atualizado automaticamente pelo interceptor do Axios
 * quando o backend retorna o header X-Correlation-ID.
 *
 * @example
 * ```tsx
 * // No App.tsx
 * <CorrelationProvider>
 *   <YourApp />
 * </CorrelationProvider>
 * ```
 */
export const CorrelationProvider: React.FC<CorrelationProviderProps> = ({ children }) => {
  const [correlationId, setCorrelationIdState] = useState<string | null>(null);

  /**
   * Define o ID de correlação e persiste no estado
   */
  const setCorrelationId = useCallback((id: string) => {
    if (id && typeof id === 'string') {
      setCorrelationIdState(id);

      // Log em desenvolvimento para debugging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[CorrelationContext] ID atualizado:', id);
      }
    }
  }, []);

  /**
   * Limpa o ID de correlação
   */
  const clearCorrelationId = useCallback(() => {
    setCorrelationIdState(null);
  }, []);

  /**
   * Registra o handler global no interceptor do Axios
   * Isso permite que o interceptor atualize o contexto automaticamente
   */
  useEffect(() => {
    setGlobalCorrelationIdHandler(setCorrelationId);

    // Cleanup: remove handler ao desmontar
    return () => {
      setGlobalCorrelationIdHandler(() => {});
    };
  }, [setCorrelationId]);

  const value: CorrelationContextType = {
    correlationId,
    setCorrelationId,
    clearCorrelationId,
  };

  return <CorrelationContext.Provider value={value}>{children}</CorrelationContext.Provider>;
};

/**
 * Hook para acessar o contexto de Correlation ID
 *
 * @throws Error se usado fora do CorrelationProvider
 *
 * @example
 * ```tsx
 * const { correlationId, setCorrelationId, clearCorrelationId } = useCorrelation();
 *
 * console.log('Current correlation ID:', correlationId);
 * ```
 */
export const useCorrelation = (): CorrelationContextType => {
  const context = useContext(CorrelationContext);
  if (!context) {
    throw new Error('useCorrelation deve ser usado dentro de um CorrelationProvider');
  }
  return context;
};
