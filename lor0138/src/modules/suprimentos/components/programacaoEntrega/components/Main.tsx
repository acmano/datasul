// src/modules/suprimentos/components/programacaoEntrega/components/Main.tsx

import React from 'react';
import { Card, Typography, Skeleton, Empty } from 'antd';

const { Text } = Typography;

interface ProgramacaoEntregaProps {
  itemCodigo: string | null;
  loading?: boolean;
}

const ProgramacaoEntrega: React.FC<ProgramacaoEntregaProps> = ({ itemCodigo, loading = false }) => {
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
      <Card title={`Programação de Entrega - ${itemCodigo}`}>
        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
          <Text style={{ color: '#666', display: 'block', marginBottom: 8 }}>
            📅 Aba Programação de Entrega em desenvolvimento
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            Esta aba exibirá a programação de entregas de fornecedores, pedidos em aberto, datas
            previstas, etc.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ProgramacaoEntrega;
