// src/modules/engenharia/estrutura/components/ListaSumarizada.tsx

import React from 'react';
import { Table, Typography } from 'antd';
import type { ComponenteSumarizado } from '../types/estrutura.types';

const { Title } = Typography;

interface Props {
  dados: ComponenteSumarizado[] | null;
}

/**
 * Componente para exibir lista sumarizada de materiais
 * (modo de apresentação "lista" da estrutura de consumo)
 */
const ListaSumarizada: React.FC<Props> = ({ dados }) => {
  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 180,
      render: (codigo: string, record: ComponenteSumarizado) =>
        `${codigo} (${record.estabelecimento || ''})`,
      sorter: (a: ComponenteSumarizado, b: ComponenteSumarizado) =>
        a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      ellipsis: true,
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidadeTotal',
      key: 'quantidadeTotal',
      width: 120,
      align: 'right' as const,
      render: (val: number) => val.toFixed(7),
      sorter: (a: ComponenteSumarizado, b: ComponenteSumarizado) =>
        a.quantidadeTotal - b.quantidadeTotal,
    },
    {
      title: 'UM',
      dataIndex: 'unidadeMedida',
      key: 'unidadeMedida',
      width: 80,
    },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Lista de Materiais Sumarizada
        </Title>
      </div>

      <Table
        dataSource={dados || []}
        columns={columns}
        rowKey="codigo"
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100', '200'],
          showTotal: (total) => `Total: ${total} materiais`,
        }}
        size="small"
        bordered
        scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
      />
    </div>
  );
};

export default ListaSumarizada;
