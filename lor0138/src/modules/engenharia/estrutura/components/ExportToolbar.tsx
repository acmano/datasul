// src/modules/engenharia/estrutura/components/ExportToolbar.tsx

import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import {
  FileTextOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
} from '@ant-design/icons';

interface ExportToolbarProps {
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  csvEnabled?: boolean;
  excelEnabled?: boolean;
  pdfEnabled?: boolean;
  printEnabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const ExportToolbar: React.FC<ExportToolbarProps> = ({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onPrint,
  csvEnabled = true,
  excelEnabled = true,
  pdfEnabled = true,
  printEnabled = true,
  size = 'small',
}) => {
  return (
    <Space size="small">
      <Tooltip
        title={
          csvEnabled ? 'Exportar para CSV' : 'Exportação CSV não disponível para esta visualização'
        }
      >
        <Button
          icon={<FileTextOutlined />}
          size={size}
          disabled={!csvEnabled}
          onClick={onExportCSV}
        >
          CSV
        </Button>
      </Tooltip>

      <Tooltip
        title={
          excelEnabled
            ? 'Exportar para Excel'
            : 'Exportação Excel não disponível para esta visualização'
        }
      >
        <Button
          icon={<FileExcelOutlined />}
          size={size}
          disabled={!excelEnabled}
          onClick={onExportExcel}
          type="primary"
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Excel
        </Button>
      </Tooltip>

      <Tooltip title={pdfEnabled ? 'Exportar para PDF' : 'Exportação PDF indisponível'}>
        <Button
          icon={<FilePdfOutlined />}
          size={size}
          disabled={!pdfEnabled}
          onClick={onExportPDF}
          danger
        >
          PDF
        </Button>
      </Tooltip>

      <Tooltip title={printEnabled ? 'Imprimir' : 'Impressão indisponível'}>
        <Button icon={<PrinterOutlined />} size={size} disabled={!printEnabled} onClick={onPrint}>
          Imprimir
        </Button>
      </Tooltip>
    </Space>
  );
};

export default ExportToolbar;
