/**
 * Health Check Page
 *
 * Página acessível via /health que mostra o status da aplicação
 */

import React, { useEffect, useState } from 'react';
import { Card, Spin, Tag, Descriptions, Typography, Space, Button } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { performHealthCheck, type HealthStatus } from '../shared/services/health.service';

const { Title, Text } = Typography;

const HealthCheckPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const loadHealthStatus = async () => {
    setLoading(true);

    try {
      const status = await performHealthCheck();
      setHealth(status);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthStatus();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadHealthStatus, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    loadHealthStatus();
  };

  if (loading && !health) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Verificando saúde da aplicação...</Text>
        </Space>
      </div>
    );
  }

  if (!health) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Text type="danger">Erro ao verificar status da aplicação</Text>
        </Card>
      </div>
    );
  }

  // Determinar cor e ícone baseado no status
  let statusColor: string;
  let statusIcon: React.ReactNode;
  let statusText: string;

  switch (health.status) {
    case 'healthy':
      statusColor = 'success';
      statusIcon = <CheckCircleOutlined />;
      statusText = 'Saudável';
      break;
    case 'degraded':
      statusColor = 'warning';
      statusIcon = <WarningOutlined />;
      statusText = 'Degradado';
      break;
    case 'unhealthy':
      statusColor = 'error';
      statusIcon = <CloseCircleOutlined />;
      statusText = 'Não Saudável';
      break;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2}>Health Check</Title>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                Atualizar
              </Button>
            </div>

            <Tag
              color={statusColor}
              icon={statusIcon}
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              {statusText}
            </Tag>

            <Text type="secondary">
              Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
            </Text>
          </Space>
        </Card>

        <Card title="Informações Gerais">
          <Descriptions column={1}>
            <Descriptions.Item label="Timestamp">{health.timestamp}</Descriptions.Item>
            <Descriptions.Item label="Versão">{health.version}</Descriptions.Item>
            <Descriptions.Item label="React Version">
              {health.frontend.reactVersion}
            </Descriptions.Item>
            <Descriptions.Item label="Ambiente">{health.frontend.environment}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Backend">
          <Descriptions column={1}>
            <Descriptions.Item label="Status">
              {health.backend.reachable ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Acessível
                </Tag>
              ) : (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  Inacessível
                </Tag>
              )}
            </Descriptions.Item>

            {health.backend.responseTime !== undefined && (
              <Descriptions.Item label="Tempo de Resposta">
                {health.backend.responseTime}ms
                {health.backend.responseTime < 500 && (
                  <Tag color="success" style={{ marginLeft: 8 }}>
                    Rápido
                  </Tag>
                )}
                {health.backend.responseTime >= 500 && health.backend.responseTime < 1000 && (
                  <Tag color="warning" style={{ marginLeft: 8 }}>
                    Normal
                  </Tag>
                )}
                {health.backend.responseTime >= 1000 && (
                  <Tag color="error" style={{ marginLeft: 8 }}>
                    Lento
                  </Tag>
                )}
              </Descriptions.Item>
            )}

            {health.backend.error && (
              <Descriptions.Item label="Erro">
                <Text type="danger">{health.backend.error}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
};

export default HealthCheckPage;
