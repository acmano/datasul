import React from 'react';
import { Empty, Card } from 'antd';
import { ItemSearchResultItem } from '../../../search/types/search.types';

interface SuprimentosTabProps {
  selectedItem: ItemSearchResultItem | undefined;
}

const Suprimentos: React.FC<SuprimentosTabProps> = ({ selectedItem }) => {
  if (!selectedItem) {
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

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <Card title={`Suprimentos - ${selectedItem.itemCodigo}`}>
        <p>
          <strong>Item:</strong> {selectedItem.itemDescricao}
        </p>
        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
          <p style={{ color: '#666', margin: 0 }}>
            📦 Dados de suprimentos, fornecedores, compras, etc. serão carregados via API
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Suprimentos;
