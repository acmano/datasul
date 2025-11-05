import React from 'react';
import { Tabs, Empty } from 'antd';
import ResultsTable from './ResultsTable';
import { ItemSearchResultItem } from '../types/search.types';

interface ResultsTabsProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({
  items,
  loading,
  selectedRowKey,
  onRowClick,
  activeTabKey,
  onTabChange,
}) => {
  const selectedItem = items.find((item) => item.itemCodigo === selectedRowKey);

  const tabItems = [
    {
      key: 'resultado',
      label: 'Resultado',
      children: (
        <ResultsTable
          items={items}
          loading={loading}
          selectedRowKey={selectedRowKey}
          onRowClick={onRowClick}
        />
      ),
    },
    {
      key: 'base',
      label: 'Base',
      children: (
        <div style={{ padding: 24 }}>
          {selectedItem ? (
            <div>
              <p>
                <strong>Item:</strong> {selectedItem.itemCodigo}
              </p>
              <p>
                <strong>Descrição:</strong> {selectedItem.itemDescricao}
              </p>
              <p style={{ color: '#999', marginTop: 20 }}>
                Dados detalhados serão implementados via API
              </p>
            </div>
          ) : (
            <Empty description="Selecione um item na aba Resultado" />
          )}
        </div>
      ),
    },
    {
      key: 'dimensoes',
      label: 'Dimensões',
      children: (
        <div style={{ padding: 24 }}>
          {selectedItem ? (
            <div>
              <p>
                <strong>Item:</strong> {selectedItem.itemCodigo}
              </p>
              <p style={{ color: '#999', marginTop: 20 }}>
                Dados de dimensões serão implementados via API
              </p>
            </div>
          ) : (
            <Empty description="Selecione um item na aba Resultado" />
          )}
        </div>
      ),
    },
    {
      key: 'planejamento',
      label: 'Planejamento',
      children: (
        <div style={{ padding: 24 }}>
          {selectedItem ? (
            <div>
              <p>
                <strong>Item:</strong> {selectedItem.itemCodigo}
              </p>
              <p style={{ color: '#999', marginTop: 20 }}>
                Dados de planejamento serão implementados via API
              </p>
            </div>
          ) : (
            <Empty description="Selecione um item na aba Resultado" />
          )}
        </div>
      ),
    },
    {
      key: 'manufatura',
      label: 'Manufatura',
      children: (
        <div style={{ padding: 24 }}>
          {selectedItem ? (
            <div>
              <p>
                <strong>Item:</strong> {selectedItem.itemCodigo}
              </p>
              <p style={{ color: '#999', marginTop: 20 }}>
                Dados de manufatura serão implementados via API
              </p>
            </div>
          ) : (
            <Empty description="Selecione um item na aba Resultado" />
          )}
        </div>
      ),
    },
    {
      key: 'fiscal',
      label: 'Fiscal',
      children: (
        <div style={{ padding: 24 }}>
          {selectedItem ? (
            <div>
              <p>
                <strong>Item:</strong> {selectedItem.itemCodigo}
              </p>
              <p style={{ color: '#999', marginTop: 20 }}>
                Dados fiscais serão implementados via API
              </p>
            </div>
          ) : (
            <Empty description="Selecione um item na aba Resultado" />
          )}
        </div>
      ),
    },
    {
      key: 'suprimentos',
      label: 'Suprimentos',
      children: (
        <div style={{ padding: 24 }}>
          {selectedItem ? (
            <div>
              <p>
                <strong>Item:</strong> {selectedItem.itemCodigo}
              </p>
              <p style={{ color: '#999', marginTop: 20 }}>
                Dados de suprimentos serão implementados via API
              </p>
            </div>
          ) : (
            <Empty description="Selecione um item na aba Resultado" />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .selected-row {
          background-color: #e6f7ff !important;
        }
        .selected-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
      <Tabs
        activeKey={activeTabKey}
        onChange={onTabChange}
        items={tabItems}
        style={{ height: '100%' }}
      />
    </>
  );
};

export default ResultsTabs;
