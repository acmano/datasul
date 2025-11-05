import React from 'react';
import { Modal, Progress, Space, Typography, Spin } from 'antd';

const { Text } = Typography;

interface CatalogExportProgressModalProps {
  visible: boolean;
  current: number;
  total: number;
  operation: 'csv' | 'xlsx';
  format?: 'single' | 'multiple';
}

const CatalogExportProgressModal: React.FC<CatalogExportProgressModalProps> = ({
  visible,
  current,
  total,
  operation,
  format = 'single',
}) => {
  // Calculate percentage, handle edge cases
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Format operation text
  const getFormatText = () => {
    if (operation === 'csv') {
      return 'CSV';
    }
    return `Excel (${format === 'single' ? 'Planilha Única' : 'Múltiplas Abas'})`;
  };

  return (
    <Modal
      title="Exportando Catálogo"
      open={visible}
      closable={false}
      maskClosable={false}
      footer={null}
      centered
      width={500}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Progresso:</Text>
          <Progress percent={percentage} status="active" />
        </div>

        <div>
          <Text>
            Processando item {current} de {total}
          </Text>
        </div>

        <div>
          <Text type="secondary">Formato: {getFormatText()}</Text>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Spin tip="Aguarde..." />
        </div>
      </Space>
    </Modal>
  );
};

export default CatalogExportProgressModal;
