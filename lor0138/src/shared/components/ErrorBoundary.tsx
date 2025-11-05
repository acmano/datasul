import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../utils/errorHandler';
import ErrorDisplay from './ErrorDisplay';
import { CorrelationContext } from '../contexts/CorrelationContext';
import logger from '../services/logger.service';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar erros de renderização React
 *
 * Integrado com Correlation ID para facilitar troubleshooting.
 * Usa ErrorDisplay para exibir erros de forma amigável.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // Com callback customizado
 * <ErrorBoundary onReset={() => console.log('Reset')}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Acesso ao CorrelationContext
  static contextType = CorrelationContext;
  context!: React.ContextType<typeof CorrelationContext>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log do erro (console/local)
    logError(error, 'ErrorBoundary');

    // Obter correlationId do contexto
    const correlationId = this.context?.correlationId;

    // Enviar para sistema de logging centralizado (envio imediato)
    logger.error(
      error.message,
      {
        component: 'ErrorBoundary',
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorName: error.name,
      },
      correlationId || undefined
    );

    // Atualizar state com informações do erro
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Obter correlationId do contexto
      const correlationId = this.context?.correlationId;

      // Renderizar ErrorDisplay
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 800, width: '100%' }}>
            <ErrorDisplay
              error={this.state.error}
              correlationId={correlationId}
              title="Ops! Algo deu errado"
              customMessage={
                process.env.NODE_ENV === 'development'
                  ? this.state.error.message
                  : 'Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente.'
              }
              onReload={() => window.location.reload()}
              showReloadButton={true}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
