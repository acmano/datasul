// src/modules/engenharia/estrutura/components/ListaFinais.tsx

import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ItemFinal } from '../types/ondeUsado.types';

interface ListaFinaisProps {
  listaFinais: ItemFinal[];
  loading?: boolean;
}

/**
 * Componente para exibir lista simples de itens finais (modo apenasFinais)
 */
export const ListaFinais: React.FC<ListaFinaisProps> = ({ listaFinais, loading = false }) => {
  const columns: ColumnsType<ItemFinal> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 150,
      sorter: (a: ItemFinal, b: ItemFinal) => a.codigo.localeCompare(b.codigo),
      fixed: 'left',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      ellipsis: true,
    },
    {
      title: 'Estabelecimento',
      dataIndex: 'estabelecimento',
      key: 'estabelecimento',
      width: 130,
      sorter: (a: ItemFinal, b: ItemFinal) => a.estabelecimento.localeCompare(b.estabelecimento),
    },
    {
      title: 'Unidade',
      dataIndex: 'unidadeMedida',
      key: 'unidadeMedida',
      width: 100,
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidadeAcumulada',
      key: 'quantidadeAcumulada',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toFixed(4),
      sorter: (a: ItemFinal, b: ItemFinal) => a.quantidadeAcumulada - b.quantidadeAcumulada,
    },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <Table
        columns={columns}
        dataSource={listaFinais}
        rowKey={(record) => `${record.codigo}_${record.estabelecimento}`}
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100', '200'],
          showTotal: (total) => `Total: ${total} itens finais`,
        }}
        size="small"
        bordered
        scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
      />
    </div>
  );
};

export default ListaFinais;
