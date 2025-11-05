import React from 'react';
import { Badge, Tooltip } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { useRateLimit } from '../contexts/RateLimitContext';

/**
 * Badge mostrando uso atual de rate limit
 *
 * Componente pequeno que exibe:
 * - Número de requests restantes
 * - Tooltip com detalhes completos
 *
 * Implementação simplificada (sem cores por enquanto).
 * Posicionar no header da aplicação (canto superior direito).
 *
 * @example
 * ```tsx
 * // No Header do App.tsx
 * <Space>
 *   <RateLimitBadge />
 *   <ThemeToggle />
 * </Space>
 * ```
 */
const RateLimitBadge: React.FC = () => {
  const { limit, remaining, reset } = useRateLimit();

  // Não renderiza se não houver informações
  if (limit === null && remaining === null) {
    return null;
  }

  /**
   * Formata timestamp de reset para hora legível
   */
  const formatResetTime = (resetTimestamp: number | null): string => {
    if (!resetTimestamp) {
      return 'Desconhecido';
    }

    const resetDate = new Date(resetTimestamp * 1000);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'Em breve';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return resetDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const tooltipTitle = (
    <div>
      <div>
        <strong>Rate Limit API</strong>
      </div>
      <div style={{ marginTop: 8 }}>
        {remaining !== null && limit !== null && (
          <div>
            Uso: {remaining} / {limit} requests
          </div>
        )}
        {remaining !== null && limit === null && <div>Restantes: {remaining} requests</div>}
        {reset && <div style={{ marginTop: 4 }}>Reset em: {formatResetTime(reset)}</div>}
      </div>
    </div>
  );

  const count = remaining !== null ? remaining : undefined;

  return (
    <Tooltip title={tooltipTitle} placement="bottomRight">
      <Badge
        count={count}
        showZero
        overflowCount={999}
        style={{
          backgroundColor: '#1890ff',
          cursor: 'pointer',
        }}
      >
        <ApiOutlined
          style={{
            fontSize: 18,
            color: '#fff',
          }}
        />
      </Badge>
    </Tooltip>
  );
};

export default RateLimitBadge;
