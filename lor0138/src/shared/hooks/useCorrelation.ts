import { useContext } from 'react';
import { CorrelationContext, CorrelationContextType } from '../contexts/CorrelationContext';

/**
 * Hook para acessar o Correlation ID
 *
 * Fornece acesso ao ID de correlação atual, usado para rastrear
 * requisições através do sistema backend/frontend.
 *
 * @throws {Error} Se usado fora do CorrelationProvider
 *
 * @returns {CorrelationContextType} Contexto com correlationId e setCorrelationId
 *
 * @example
 * ```tsx
 * const { correlationId } = useCorrelation();
 *
 * // Exibir em componente de erro
 * {correlationId && (
 *   <div>ID de rastreamento: {correlationId}</div>
 * )}
 * ```
 *
 * @example
 * ```tsx
 * // Em ErrorDisplay
 * const { correlationId } = useCorrelation();
 *
 * const handleCopy = () => {
 *   if (correlationId) {
 *     navigator.clipboard.writeText(correlationId);
 *   }
 * };
 * ```
 */
export const useCorrelation = (): CorrelationContextType => {
  const context = useContext(CorrelationContext);

  if (context === undefined) {
    throw new Error(
      'useCorrelation deve ser usado dentro de um CorrelationProvider. ' +
        'Certifique-se de que seu componente está envolvido pelo CorrelationProvider.'
    );
  }

  return context;
};
