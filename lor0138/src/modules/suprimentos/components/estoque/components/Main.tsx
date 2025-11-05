// src/modules/suprimentos/components/estoque/components/Main.tsx

import React from 'react';
import { Card, Typography, Skeleton, Empty } from 'antd';

const { Text } = Typography;

interface EstoqueProps {
  itemCodigo: string | null;
  loading?: boolean;
}

const Estoque: React.FC<EstoqueProps> = ({ itemCodigo, loading = false }) => {
  if (!itemCodigo) {
    return (
      <div
        style={{
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Empty description="Selecione um item na aba Resultado" />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <Card title={`Estoque - Saldos de Estoque - ${itemCodigo}`}>
        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
          <Text style={{ color: '#666', display: 'block', marginBottom: 8 }}>
            📊 Aba Estoque - Saldos de Estoque em desenvolvimento
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            Esta aba exibirá informações sobre saldos de estoque, disponibilidade, reservas, etc.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Estoque;
