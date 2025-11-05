// src/shared/components/ResultadoTab.tsx
// Shared component for rendering search results table across all modules

import React, { useEffect, useRef } from 'react';
import { Tabs, Table, theme, Empty } from 'antd';
import { ItemSearchResultItem } from '../../modules/item/search/types/search.types';
import ExportButtons from './ExportButtons';

/**
 * Props for the ResultadoTab component
 */
export interface ResultadoTabProps {
  /** Array of search result items to display */
  items: ItemSearchResultItem[];

  /** Loading state for the table */
  loading: boolean;

  /** Currently selected row key (itemCodigo) */
  selectedRowKey: string | null;

  /** Callback when a row is clicked */
  onRowClick: (record: ItemSearchResultItem) => void;

  /** Keyboard event handler for navigation */
  onKeyDown?: (e: React.KeyboardEvent) => void;

  /** Active tab key to detect when returning to Resultado tab */
  activeTabKey?: string;

  /** Custom empty message when no results */
  emptyMessage?: string;

  /** Additional custom columns to append to default columns */
  extraColumns?: any[];

  /** Whether to show type column */
  showTypeColumn?: boolean;

  /** Whether to show family columns */
  showFamilyColumns?: boolean;

  /** Custom table height (default: calc(100vh - 420px)) */
  tableHeight?: string;

  /** Export mode: 'item' or 'catalog' */
  exportMode?: 'item' | 'catalog';

  /** Callback when export mode changes */
  onExportModeChange?: (mode: 'item' | 'catalog') => void;

  /** Catalog format: 'single' or 'multiple' */
  catalogFormat?: 'single' | 'multiple';

  /** Callback when catalog format changes */
  onCatalogFormatChange?: (format: 'single' | 'multiple') => void;

  /** Callback for CSV export */
  onExportCSV?: () => void;

  /** Callback for XLSX export */
  onExportXLSX?: () => void;

  /** Callback for PDF export */
  onExportPDF?: () => void;

  /** Callback for print */
  onPrint?: () => void;
}

/**
 * Shared ResultadoTab Component
 *
 * A reusable component for displaying search results in a table format.
 * Used across multiple modules: Dados Cadastrais, Engenharia, Suprimentos, PCP, Manufatura, Fiscal.
 *
 * Features:
 * - Row selection with visual feedback
 * - Keyboard navigation support
 * - Auto-scroll to selected row
 * - Auto-focus when returning to tab
 * - Zebra striping
 * - Responsive columns with ellipsis
 * - Theme-aware styling (dark/light mode)
 *
 * @example
 * ```tsx
 * <ResultadoTab
 *   items={searchResults}
 *   loading={isLoading}
 *   selectedRowKey={selectedItem}
 *   onRowClick={handleRowClick}
 *   onKeyDown={handleKeyDown}
 *   activeTabKey={currentTab}
 * />
 * ```
 */
const ResultadoTab: React.FC<ResultadoTabProps> = ({
  items,
  loading,
  selectedRowKey,
  onRowClick,
  onKeyDown,
  activeTabKey,
  emptyMessage = 'Nenhum resultado encontrado',
  extraColumns = [],
  showTypeColumn = true,
  showFamilyColumns = true,
  tableHeight = 'calc(100vh - 420px)',
  exportMode = 'item',
  onExportModeChange,
  catalogFormat = 'single',
  onCatalogFormatChange,
  onExportCSV,
  onExportXLSX,
  onExportPDF,
  onPrint,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();

  // Auto-focus on table when returning to Resultado tab
  useEffect(() => {
    if (activeTabKey === 'resultado' && items.length > 0 && tableRef.current) {
      // Delay to ensure tab is fully rendered
      const timer = setTimeout(() => {
        tableRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTabKey, items.length]);

  // Auto-scroll to selected row
  useEffect(() => {
    if (!selectedRowKey || !tableRef.current) {
      return;
    }

    const selectedRow = tableRef.current.querySelector(
      `tr[data-row-key="${selectedRowKey}"]`
    ) as HTMLElement;

    if (selectedRow) {
      selectedRow.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedRowKey]);

  // Default columns configuration
  const defaultColumns = [
    {
      title: 'Código',
      dataIndex: 'itemCodigo',
      key: 'itemCodigo',
      width: 120,
      fixed: 'left' as const,
      ellipsis: true,
    },
    {
      title: 'Descrição',
      dataIndex: 'itemDescricao',
      key: 'itemDescricao',
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Unidade',
      dataIndex: 'unidadeMedidaCodigo',
      key: 'unidadeMedidaCodigo',
      width: 100,
      ellipsis: true,
    },
  ];

  // Type column (conditional)
  const typeColumn = showTypeColumn
    ? {
        title: 'Tipo',
        key: 'tipo',
        width: 180,
        ellipsis: true,
        render: (record: ItemSearchResultItem) => {
          const tipoMap: Record<string, string> = {
            '0': 'Mercadoria para Revenda',
            '1': 'Matéria-prima',
            '2': 'Embalagem',
            '3': 'Produto em Processo',
            '4': 'Produto Acabado',
            '5': 'Subproduto',
            '6': 'Produto Intermediário',
            '7': 'Material de Uso e Consumo',
            '8': 'Ativo Imobilizado',
            '9': 'Serviços',
            '10': 'Outros Insumos',
            '99': 'Outras',
          };

          if (!record.tipo) {
            return '';
          }
          const text = `${record.tipo} - ${tipoMap[record.tipo] || ''}`;
          return <span title={text}>{text}</span>;
        },
      }
    : null;

  // Family columns (conditional)
  const familyColumns = showFamilyColumns
    ? [
        {
          title: 'Família',
          key: 'familia',
          width: 250,
          ellipsis: true,
          render: (record: ItemSearchResultItem) => {
            const text = record.familiaCodigo
              ? `${record.familiaCodigo}${record.familiaDescricao ? ` - ${record.familiaDescricao}` : ''}`
              : '';
            return <span title={text}>{text}</span>;
          },
        },
        {
          title: 'Família Comercial',
          key: 'familiaComercial',
          width: 250,
          ellipsis: true,
          render: (record: ItemSearchResultItem) => {
            const text = record.familiaComercialCodigo
              ? `${record.familiaComercialCodigo}${record.familiaComercialDescricao ? ` - ${record.familiaComercialDescricao}` : ''}`
              : '';
            return <span title={text}>{text}</span>;
          },
        },
        {
          title: 'Grupo de Estoque',
          key: 'grupoEstoque',
          width: 250,
          ellipsis: true,
          render: (record: ItemSearchResultItem) => {
            const text = record.grupoEstoqueCodigo
              ? `${record.grupoEstoqueCodigo}${record.grupoEstoqueDescricao ? ` - ${record.grupoEstoqueDescricao}` : ''}`
              : '';
            return <span title={text}>{text}</span>;
          },
        },
      ]
    : [];

  // Combine all columns
  const columns = [
    ...defaultColumns,
    ...(typeColumn ? [typeColumn] : []),
    ...familyColumns,
    ...extraColumns,
  ];

  // Theme-aware colors
  const isDark = token.colorBgContainer === '#141414';
  const bgEven = isDark ? '#1f1f1f' : '#e8e8e8';
  const bgOdd = isDark ? '#141414' : '#ffffff';
  const hoverBg = isDark ? '#177ddc' : '#bae7ff';

  // Default no-op handlers for export buttons if not provided
  const handleExportCSV = onExportCSV || (() => {});
  const handleExportXLSX = onExportXLSX || (() => {});
  const handleExportPDF = onExportPDF || (() => {});
  const handlePrint = onPrint || (() => {});
  const handleExportModeChange = onExportModeChange || (() => {});
  const handleCatalogFormatChange = onCatalogFormatChange || (() => {});

  // Determine if export buttons should be shown (at least one handler provided)
  const showExportButtons = onExportCSV || onExportXLSX || onExportPDF || onPrint;

  const tableContent = (
    <div
      ref={tableRef}
      tabIndex={0}
      data-resultado-tab="true"
      onKeyDown={onKeyDown}
      style={{ outline: 'none', height: '100%' }}
    >
      <Table
        columns={columns}
        dataSource={items}
        loading={loading}
        rowKey="itemCodigo"
        pagination={false}
        scroll={{ x: 1200, y: tableHeight }}
        size="small"
        locale={{
          emptyText: <Empty description={emptyMessage} />,
        }}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          className: record.itemCodigo === selectedRowKey ? 'resultado-tab-row-selected' : '',
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );

  return (
    <>
      <style>{`
        /* Selected row styling - ALL cells including fixed */
        .resultado-tab-row-selected td {
          background-color: #1890ff !important;
          color: #fff !important;
          font-weight: 500 !important;
        }

        /* Selected row on hover - maintain color */
        .resultado-tab-row-selected:hover td {
          background-color: #1890ff !important;
          color: #fff !important;
        }

        /* Fixed height for rows */
        .ant-table-tbody > tr > td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Ensure fixed columns also receive styling */
        .ant-table-cell-fix-left.resultado-tab-row-selected,
        .resultado-tab-row-selected .ant-table-cell-fix-left {
          background-color: #1890ff !important;
          color: #fff !important;
        }

        /* Zebra striping - even rows */
        .ant-table-tbody > tr:nth-child(even):not(.resultado-tab-row-selected) > td {
          background-color: ${bgEven} !important;
        }

        /* Zebra striping - odd rows */
        .ant-table-tbody > tr:nth-child(odd):not(.resultado-tab-row-selected) > td {
          background-color: ${bgOdd} !important;
        }

        /* Hover effect on non-selected rows */
        .ant-table-tbody > tr:not(.resultado-tab-row-selected):hover > td {
          background-color: ${hoverBg} !important;
        }
      `}</style>
      {showExportButtons ? (
        <Tabs
          items={[
            {
              key: 'resultado',
              label: 'Resultado',
              children: tableContent,
            },
          ]}
          tabBarExtraContent={
            <ExportButtons
              onExportCSV={handleExportCSV}
              onExportXLSX={handleExportXLSX}
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
              disabled={loading}
              hasData={items.length > 0}
              showModeToggle={true}
              exportMode={exportMode}
              onExportModeChange={handleExportModeChange}
              catalogFormat={catalogFormat}
              onCatalogFormatChange={handleCatalogFormatChange}
            />
          }
        />
      ) : (
        tableContent
      )}
    </>
  );
};

export default ResultadoTab;
