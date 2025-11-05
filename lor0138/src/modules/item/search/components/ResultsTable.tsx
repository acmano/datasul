import React, { useEffect, useRef } from 'react';
import { Table, theme } from 'antd';
import { ItemSearchResultItem } from '../types/search.types';

interface ResultsTableProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  activeTabKey?: string; // ✅ NOVO: Para detectar quando voltar para aba Resultado
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  items,
  loading,
  selectedRowKey,
  onRowClick,
  onKeyDown,
  activeTabKey,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();

  // ✅ Dar foco na tabela quando voltar para aba Resultado
  useEffect(() => {
    if (activeTabKey === 'resultado' && items.length > 0 && tableRef.current) {
      // Delay para garantir que a aba está completamente renderizada
      const timer = setTimeout(() => {
        tableRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTabKey, items.length]);

  // Scroll automático para linha selecionada
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

  const columns = [
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
    {
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
    },
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
  ];

  // Cores dinâmicas baseadas no tema
  const isDark = token.colorBgContainer === '#141414';
  const bgEven = isDark ? '#1f1f1f' : '#e8e8e8'; // Escurecido no modo claro
  const bgOdd = isDark ? '#141414' : '#ffffff';
  const hoverBg = isDark ? '#177ddc' : '#bae7ff';

  return (
    <>
      <style>{`
        /* Linha selecionada - TODAS as células incluindo fixed */
        .results-table-row-selected td {
          background-color: #1890ff !important;
          color: #fff !important;
          font-weight: 500 !important;
        }

        /* Linha selecionada no hover - mantém a cor */
        .results-table-row-selected:hover td {
          background-color: #1890ff !important;
          color: #fff !important;
        }

        /* Altura fixa das linhas */
        .ant-table-tbody > tr > td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Garante que colunas fixas também recebam o estilo */
        .ant-table-cell-fix-left.results-table-row-selected,
        .results-table-row-selected .ant-table-cell-fix-left {
          background-color: #1890ff !important;
          color: #fff !important;
        }

        /* Zebra striping - linhas pares */
        .ant-table-tbody > tr:nth-child(even):not(.results-table-row-selected) > td {
          background-color: ${bgEven} !important;
        }

        /* Zebra striping - linhas ímpares */
        .ant-table-tbody > tr:nth-child(odd):not(.results-table-row-selected) > td {
          background-color: ${bgOdd} !important;
        }

        /* Hover normal em linhas NÃO selecionadas */
        .ant-table-tbody > tr:not(.results-table-row-selected):hover > td {
          background-color: ${hoverBg} !important;
        }
      `}</style>
      <div
        ref={tableRef}
        tabIndex={0}
        data-results-table="true"
        onKeyDown={onKeyDown}
        style={{ outline: 'none', height: '100%' }}
      >
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          rowKey="itemCodigo"
          pagination={false}
          scroll={{ x: 1200, y: 'calc(100vh - 420px)' }}
          size="small"
          onRow={(record) => ({
            onClick: () => onRowClick(record),
            className: record.itemCodigo === selectedRowKey ? 'results-table-row-selected' : '',
            style: { cursor: 'pointer' },
          })}
        />
      </div>
    </>
  );
};

export default ResultsTable;
