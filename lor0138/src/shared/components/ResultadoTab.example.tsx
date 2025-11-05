// src/shared/components/ResultadoTab.example.tsx
// Usage examples for the ResultadoTab shared component

import React from 'react';
import ResultadoTab from './ResultadoTab';
import { ItemSearchResultItem } from '../../modules/item/search/types/search.types';

/**
 * Example 1: Basic Usage (Default Behavior)
 * This is the most common use case - same as original ResultsTable
 */
export const BasicExample: React.FC = () => {
  const [items, setItems] = React.useState<ItemSearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedRowKey, setSelectedRowKey] = React.useState<string | null>(null);
  const [activeTabKey, setActiveTabKey] = React.useState('resultado');

  const handleRowClick = (record: ItemSearchResultItem) => {
    setSelectedRowKey(record.itemCodigo);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard navigation
    console.log('Key pressed:', e.key);
  };

  return (
    <ResultadoTab
      items={items}
      loading={loading}
      selectedRowKey={selectedRowKey}
      onRowClick={handleRowClick}
      onKeyDown={handleKeyDown}
      activeTabKey={activeTabKey}
    />
  );
};

/**
 * Example 2: Custom Empty Message
 * Use different messages per module
 */
export const CustomEmptyMessageExample: React.FC = () => {
  const items: ItemSearchResultItem[] = [];

  return (
    <ResultadoTab
      items={items}
      loading={false}
      selectedRowKey={null}
      onRowClick={() => {}}
      emptyMessage="Nenhuma estrutura encontrada. Execute uma busca para visualizar resultados."
    />
  );
};

/**
 * Example 3: Hide Type and Family Columns
 * Useful for modules that don't need these columns
 */
export const SimplifiedColumnsExample: React.FC = () => {
  const [items, setItems] = React.useState<ItemSearchResultItem[]>([]);

  return (
    <ResultadoTab
      items={items}
      loading={false}
      selectedRowKey={null}
      onRowClick={() => {}}
      showTypeColumn={false}
      showFamilyColumns={false}
    />
  );
};

/**
 * Example 4: Add Custom Columns
 * Extend the table with module-specific columns
 */
export const CustomColumnsExample: React.FC = () => {
  const [items, setItems] = React.useState<ItemSearchResultItem[]>([]);

  // Define custom columns for Suprimentos module
  const suprimentosColumns = [
    {
      title: 'Saldo',
      key: 'saldo',
      width: 120,
      render: (record: ItemSearchResultItem) => {
        // Custom rendering logic
        return <span>0.00</span>;
      },
    },
    {
      title: 'Fornecedor',
      key: 'fornecedor',
      width: 200,
      ellipsis: true,
      render: (record: ItemSearchResultItem) => {
        return <span>-</span>;
      },
    },
  ];

  return (
    <ResultadoTab
      items={items}
      loading={false}
      selectedRowKey={null}
      onRowClick={() => {}}
      extraColumns={suprimentosColumns}
    />
  );
};

/**
 * Example 5: Custom Table Height
 * Adjust height based on module layout
 */
export const CustomHeightExample: React.FC = () => {
  const [items, setItems] = React.useState<ItemSearchResultItem[]>([]);

  return (
    <ResultadoTab
      items={items}
      loading={false}
      selectedRowKey={null}
      onRowClick={() => {}}
      tableHeight="calc(100vh - 500px)" // Taller header in this module
    />
  );
};

/**
 * Example 6: Full Customization
 * Combine multiple options
 */
export const FullCustomizationExample: React.FC = () => {
  const [items, setItems] = React.useState<ItemSearchResultItem[]>([]);
  const [selectedRowKey, setSelectedRowKey] = React.useState<string | null>(null);

  const customColumns = [
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: () => <span style={{ color: 'green' }}>Ativo</span>,
    },
  ];

  return (
    <ResultadoTab
      items={items}
      loading={false}
      selectedRowKey={selectedRowKey}
      onRowClick={(record) => setSelectedRowKey(record.itemCodigo)}
      emptyMessage="Nenhum item encontrado neste módulo"
      extraColumns={customColumns}
      showTypeColumn={true}
      showFamilyColumns={false}
      tableHeight="calc(100vh - 450px)"
    />
  );
};

/**
 * Example 7: Migration from ResultsTable
 * Before and After comparison
 */
export const MigrationExample: React.FC = () => {
  const [items, setItems] = React.useState<ItemSearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedRowKey, setSelectedRowKey] = React.useState<string | null>(null);
  const [activeTabKey, setActiveTabKey] = React.useState('resultado');

  const handleRowClick = (record: ItemSearchResultItem) => {
    setSelectedRowKey(record.itemCodigo);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key);
  };

  // BEFORE (old way):
  // import Resultado from '../../search/components/ResultsTable';
  //
  // <Resultado
  //   items={items}
  //   loading={loading}
  //   selectedRowKey={selectedRowKey}
  //   onRowClick={handleRowClick}
  //   onKeyDown={handleKeyDown}
  //   activeTabKey={activeTabKey}
  // />

  // AFTER (new way - exactly the same props!):
  return (
    <ResultadoTab
      items={items}
      loading={loading}
      selectedRowKey={selectedRowKey}
      onRowClick={handleRowClick}
      onKeyDown={handleKeyDown}
      activeTabKey={activeTabKey}
    />
  );
};

/**
 * Example 8: Real-world usage in Dados Cadastrais
 */
export const DadosCadastraisExample: React.FC<{
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  activeTabKey: string;
}> = ({ items, loading, selectedRowKey, onRowClick, onKeyDown, activeTabKey }) => {
  return (
    <ResultadoTab
      items={items}
      loading={loading}
      selectedRowKey={selectedRowKey}
      onRowClick={onRowClick}
      onKeyDown={onKeyDown}
      activeTabKey={activeTabKey}
      // All defaults work perfectly
    />
  );
};

/**
 * Example 9: Real-world usage in Engenharia
 */
export const EngenhariaExample: React.FC<{
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ items, loading, selectedRowKey, onRowClick, onKeyDown }) => {
  return (
    <ResultadoTab
      items={items}
      loading={loading}
      selectedRowKey={selectedRowKey}
      onRowClick={onRowClick}
      onKeyDown={onKeyDown}
      // Engenharia doesn't use activeTabKey - that's fine!
    />
  );
};

/**
 * Example 10: Real-world usage in Suprimentos with custom columns
 */
export const SuprimentosExample: React.FC<{
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  activeTabKey: string;
}> = ({ items, loading, selectedRowKey, onRowClick, onKeyDown, activeTabKey }) => {
  // Add Suprimentos-specific columns
  const suprimentosColumns = [
    {
      title: 'Saldo Atual',
      key: 'saldo',
      width: 120,
      align: 'right' as const,
      render: () => '0,00',
    },
    {
      title: 'Lead Time',
      key: 'leadTime',
      width: 100,
      align: 'center' as const,
      render: () => '30 dias',
    },
  ];

  return (
    <ResultadoTab
      items={items}
      loading={loading}
      selectedRowKey={selectedRowKey}
      onRowClick={onRowClick}
      onKeyDown={onKeyDown}
      activeTabKey={activeTabKey}
      extraColumns={suprimentosColumns}
      emptyMessage="Nenhum item encontrado em Suprimentos"
    />
  );
};
