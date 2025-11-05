import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';

/**
 * Props do componente RateLimitWarning
 */
export interface RateLimitWarningProps {
  /**
   * Controla visibilidade do alerta
   */
  isVisible: boolean;

  /**
   * Segundos restantes até poder tentar novamente
   */
  retryAfter: number;

  /**
   * Callback chamado quando usuário clica em "Tentar Novamente"
   */
  onRetry: () => void;

  /**
   * Callback chamado quando usuário fecha o alerta
   */
  onClose: () => void;
}

/**
 * Formata segundos em texto legível (mm:ss)
 *
 * @param seconds - Segundos a formatar
 * @returns String formatada (ex: "1:30", "0:05")
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Componente de alerta de Rate Limit
 *
 * Exibe mensagem amigável quando usuário atinge o limite de requisições.
 * Mostra countdown e permite retry quando tempo expirar.
 *
 * Features:
 * - Alert sticky no topo da página
 * - Countdown em tempo real
 * - Botão de retry (desabilitado até countdown = 0)
 * - Mensagem clara e amigável
 * - Acessível (role="alert")
 *
 * @example
 * ```tsx
 * <RateLimitWarning
 *   isVisible={isRateLimited}
 *   retryAfter={seconds}
 *   onRetry={handleRetry}
 *   onClose={handleClose}
 * />
 * ```
 */
const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
  isVisible,
  retryAfter,
  onRetry,
  onClose,
}) => {
  if (!isVisible) {
    return null;
  }

  const canRetry = retryAfter <= 0;
  const timeText = formatTime(retryAfter);

  return (
    <div
      style={{
        position: 'fixed',
        top: 64, // Abaixo do header (64px de altura)
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '12px 24px',
        background: 'transparent',
      }}
      role="alert"
      aria-live="assertive"
    >
      <Alert
        type="warning"
        showIcon
        icon={<ClockCircleOutlined />}
        message="Limite de requisições atingido"
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <p style={{ margin: 0 }}>
              Você atingiu o limite de requisições permitidas. Por favor, aguarde antes de tentar
              novamente.
            </p>
            {!canRetry && (
              <p style={{ margin: 0, fontWeight: 'bold' }}>Tempo restante: {timeText}</p>
            )}
            {canRetry && (
              <p style={{ margin: 0, fontWeight: 'bold', color: '#52c41a' }}>
                Você já pode tentar novamente!
              </p>
            )}
          </Space>
        }
        closable
        onClose={onClose}
        action={
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            onClick={onRetry}
            disabled={!canRetry}
            style={{
              marginTop: 4,
            }}
          >
            Tentar Novamente
          </Button>
        }
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      />
    </div>
  );
};

export default RateLimitWarning;
