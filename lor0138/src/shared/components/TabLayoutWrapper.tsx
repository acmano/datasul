import React from 'react';
import { Alert, Empty } from 'antd';
import SkeletonForm from './SkeletonForm';

interface TabLayoutWrapperProps {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  title?: React.ReactNode;
  menuContent?: React.ReactNode;
  menuWidth?: number;
  children: React.ReactNode;
}

const TabLayoutWrapper: React.FC<TabLayoutWrapperProps> = ({
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'Nenhum dado disponível',
  title,
  menuContent,
  menuWidth = 200,
  children,
}) => {
  if (loading) {
    return <SkeletonForm rows={5} columns={2} />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Erro ao carregar dados" description={error} type="error" showIcon />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
      >
        <Empty description={emptyMessage} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
      {title && <div style={{ marginBottom: '16px' }}>{title}</div>}

      <div style={{ display: 'flex', flex: 1, gap: '16px', overflow: 'hidden' }}>
        {menuContent && (
          <div style={{ width: menuWidth, flexShrink: 0, borderRight: '1px solid #f0f0f0' }}>
            {menuContent}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};

export default TabLayoutWrapper;
