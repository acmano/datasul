import React from 'react';
import { Card, Tag, Button, Space, Typography, Descriptions } from 'antd';
import { CopyOutlined, ReloadOutlined, BugOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useCorrelation } from '@shared/hooks/useCorrelation';

const { Text } = Typography;

/**
 * Componente de Debug do Correlation ID
 *
 * Mostra o Correlation ID atual e permite testá-lo.
 * APENAS para desenvolvimento/debugging.
 *
 * @example
 * ```tsx
 * // Adicione em uma página de debug ou settings
 * {process.env.NODE_ENV === 'development' && (
 *   <CorrelationIdDebugger />
 * )}
 * ```
 */
const CorrelationIdDebugger: React.FC = () => {
  const { correlationId, clearCorrelationId } = useCorrelation();

  /**
   * Copia o Correlation ID
   */
  const handleCopy = async (): Promise<void> => {
    if (!correlationId) {
      message.warning('Nenhum Correlation ID disponível ainda');
      return;
    }

    try {
      await navigator.clipboard.writeText(correlationId);
      message.success('Correlation ID copiado!');
    } catch (err) {
      message.error('Erro ao copiar');
    }
  };

  /**
   * Força um erro para testar ErrorBoundary
   */
  const handleForceError = (): void => {
    throw new Error('Erro de teste forçado para demonstração do ErrorBoundary com Correlation ID');
  };

  /**
   * Limpa o Correlation ID
   */
  const handleClear = (): void => {
    clearCorrelationId();
    message.info('Correlation ID limpo');
  };

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          <span>Correlation ID Debugger</span>
          <Tag color="orange">DEV ONLY</Tag>
        </Space>
      }
      style={{ margin: 16 }}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Status">
          {correlationId ? (
            <Tag color="success">Ativo</Tag>
          ) : (
            <Tag color="default">Aguardando requisição</Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Correlation ID">
          {correlationId ? (
            <Text code style={{ fontSize: 12 }}>
              {correlationId}
            </Text>
          ) : (
            <Text type="secondary">Nenhuma requisição feita ainda</Text>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Formato">
          <Text type="secondary">UUID v4</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Origem">
          <Text type="secondary">Backend (X-Correlation-ID header)</Text>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16 }}>
        <Space wrap>
          <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!correlationId}>
            Copiar ID
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleClear} disabled={!correlationId}>
            Limpar ID
          </Button>

          <Button danger icon={<BugOutlined />} onClick={handleForceError}>
            Forçar Erro (teste ErrorBoundary)
          </Button>
        </Space>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
          fontSize: 12,
        }}
      >
        <Text strong>Como testar:</Text>
        <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
          <li>Faça uma requisição qualquer à API</li>
          <li>O Correlation ID aparecerá automaticamente aqui</li>
          <li>Copie o ID e busque nos logs do backend</li>
          <li>Ou clique em "Forçar Erro" para testar o ErrorBoundary</li>
        </ol>
      </div>
    </Card>
  );
};

export default CorrelationIdDebugger;
