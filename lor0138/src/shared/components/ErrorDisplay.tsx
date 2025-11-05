import React from 'react';
import { Alert, Button, Space, Typography, Divider } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { env } from '../utils/env';

const { Text, Paragraph } = Typography;

export interface ErrorDisplayProps {
  /**
   * Erro a ser exibido
   */
  error: Error;

  /**
   * Correlation ID para rastreamento (opcional)
   */
  correlationId?: string | null;

  /**
   * Título customizado (opcional)
   */
  title?: string;

  /**
   * Callback quando usuário clica em "Recarregar"
   */
  onReload?: () => void;

  /**
   * Mostrar botão de recarregar (padrão: true)
   */
  showReloadButton?: boolean;

  /**
   * Tipo do alerta (padrão: 'error')
   */
  type?: 'error' | 'warning' | 'info';

  /**
   * Mensagem customizada para o usuário
   */
  customMessage?: string;
}

/**
 * Componente para exibir erros com Correlation ID
 *
 * Exibe mensagens de erro de forma amigável, com opção de
 * copiar o Correlation ID para troubleshooting.
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error={error}
 *   correlationId={correlationId}
 *   onReload={() => window.location.reload()}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Em ErrorBoundary
 * <ErrorDisplay
 *   error={error}
 *   correlationId={correlationId}
 *   title="Erro inesperado"
 *   customMessage="Algo deu errado. Tente novamente."
 * />
 * ```
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  correlationId,
  title = 'Erro',
  onReload,
  showReloadButton = true,
  type = 'error',
  customMessage,
}) => {
  /**
   * Copia o Correlation ID para a área de transferência
   */
  const handleCopyCorrelationId = async (): Promise<void> => {
    if (!correlationId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(correlationId);
      message.success('ID copiado para a área de transferência');
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = correlationId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        message.success('ID copiado para a área de transferência');
      } catch (fallbackErr) {
        message.error('Erro ao copiar ID');
      }
    }
  };

  /**
   * Handler do botão recarregar
   */
  const handleReload = (): void => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  // Mensagem a ser exibida
  const displayMessage = customMessage || error.message || 'Ocorreu um erro inesperado';

  return (
    <Alert
      type={type}
      showIcon
      message={title}
      description={
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Mensagem de erro */}
          <Paragraph style={{ marginBottom: 0 }}>{displayMessage}</Paragraph>

          {/* Correlation ID (se disponível) */}
          {correlationId && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text strong>ID de Rastreamento:</Text>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Text
                    code
                    copyable={false}
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                      flex: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {correlationId}
                  </Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={handleCopyCorrelationId}
                    title="Copiar ID"
                  >
                    Copiar
                  </Button>
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  Copie este ID ao reportar o problema para facilitar o diagnóstico.
                </Text>
              </div>
            </>
          )}

          {/* Botão de recarregar */}
          {showReloadButton && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleReload}>
                Recarregar Página
              </Button>
            </>
          )}

          {/* Stack trace em desenvolvimento */}
          {env.IS_DEV && error.stack && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ fontWeight: 500, marginBottom: 8 }}>
                  Stack Trace (Desenvolvimento)
                </summary>
                <pre
                  style={{
                    fontSize: 11,
                    backgroundColor: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 300,
                    margin: 0,
                  }}
                >
                  {error.stack}
                </pre>
              </details>
            </>
          )}
        </Space>
      }
      style={{ width: '100%' }}
    />
  );
};

export default ErrorDisplay;
