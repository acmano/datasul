// src/modules/engenharia/estrutura/components/Breadcrumb.tsx

import React from 'react';
import { Breadcrumb as AntBreadcrumb, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { formatarCodigoComEstab } from '../utils/formatters';

export interface BreadcrumbItem {
  codigo: string;
  descricao?: string;
  estabelecimento?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (codigo: string, index: number) => void;
  theme: 'light' | 'dark';
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate, theme }) => {
  if (items.length === 0) {
    return null;
  }

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const codigoFormatado = formatarCodigoComEstab(item.codigo, item.estabelecimento);
    const label = item.descricao ? `${codigoFormatado} - ${item.descricao}` : codigoFormatado;

    return {
      key: item.codigo + index,
      title: isLast ? (
        <Typography.Text strong style={{ fontSize: 13 }}>
          {index === 0 && <HomeOutlined style={{ marginRight: 6 }} />}
          {label}
        </Typography.Text>
      ) : (
        <Typography.Link onClick={() => onNavigate(item.codigo, index)} style={{ fontSize: 13 }}>
          {index === 0 && <HomeOutlined style={{ marginRight: 6 }} />}
          {label}
        </Typography.Link>
      ),
    };
  });

  return (
    <div
      style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
        background: theme === 'dark' ? '#141414' : '#fafafa',
      }}
    >
      <AntBreadcrumb items={breadcrumbItems} separator="›" />
    </div>
  );
};

export default Breadcrumb;
