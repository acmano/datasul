// src/modules/suprimentos/components/movimento/components/Main.tsx

import React from 'react';
import { Card, Typography, Skeleton, Empty } from 'antd';

const { Text } = Typography;

interface MovimentoProps {
  itemCodigo: string | null;
  loading?: boolean;
}

const Movimento: React.FC<MovimentoProps> = ({ itemCodigo, loading = false }) => {
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
      <Card title={`Movimento - Movimentação - ${itemCodigo}`}>
        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
          <Text style={{ color: '#666', display: 'block', marginBottom: 8 }}>
            🔄 Aba Movimento - Movimentação em desenvolvimento
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            Esta aba exibirá o histórico de movimentação de estoque do item (entradas, saídas,
            transferências, etc.).
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Movimento;
