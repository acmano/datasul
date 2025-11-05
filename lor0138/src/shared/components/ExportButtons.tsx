import React, { memo } from 'react';
import { Button, Space, Tooltip, Switch, Radio, Typography, Divider } from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface ExportButtonsProps {
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  disabled?: boolean;
  hasData?: boolean;
  exportMode?: 'item' | 'catalog';
  onExportModeChange?: (mode: 'item' | 'catalog') => void;
  catalogFormat?: 'single' | 'multiple';
  onCatalogFormatChange?: (format: 'single' | 'multiple') => void;
  showModeToggle?: boolean;
}

/**
 * Componente apresentacional para botões de exportação
 * Memoizado para evitar re-renders desnecessários
 */
const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportCSV,
  onExportXLSX,
  onExportPDF,
  onPrint,
  disabled = false,
  hasData = true,
  exportMode = 'item',
  onExportModeChange,
  catalogFormat = 'single',
  onCatalogFormatChange,
  showModeToggle = false,
}) => {
  const isDisabled = disabled || !hasData;

  // Determine button states based on export mode
  const isCatalogMode = exportMode === 'catalog';
  const csvDisabled = isCatalogMode ? disabled : isDisabled;
  const excelDisabled = isCatalogMode ? disabled : isDisabled;
  const pdfDisabled = isCatalogMode ? true : isDisabled;
  const printDisabled = isCatalogMode ? true : isDisabled;

  return (
    <Space size="middle">
      {showModeToggle && (
        <Space size="small" style={{ alignItems: 'center' }}>
          <Text>Modo:</Text>
          <Switch
            checkedChildren="Catálogo"
            unCheckedChildren="Item"
            checked={exportMode === 'catalog'}
            onChange={(checked) => onExportModeChange?.(checked ? 'catalog' : 'item')}
          />
        </Space>
      )}

      {exportMode === 'catalog' && (
        <Space size="small">
          <Text>Formato:</Text>
          <Radio.Group
            value={catalogFormat}
            onChange={(e) => onCatalogFormatChange?.(e.target.value)}
            size="small"
          >
            <Radio.Button value="single">Planilha Única</Radio.Button>
            <Radio.Button value="multiple">Múltiplas Abas</Radio.Button>
          </Radio.Group>
        </Space>
      )}

      {showModeToggle && <Divider type="vertical" style={{ height: '24px' }} />}

      <Space size="small">
        <Tooltip title="Exportar para CSV">
          <Button
            icon={<FileTextOutlined />}
            onClick={onExportCSV}
            disabled={csvDisabled}
            size="small"
          >
            CSV
          </Button>
        </Tooltip>

        <Tooltip title="Exportar para Excel">
          <Button
            icon={<FileExcelOutlined />}
            onClick={onExportXLSX}
            disabled={excelDisabled}
            size="small"
            type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Excel
          </Button>
        </Tooltip>

        <Tooltip title="Exportar para PDF">
          <Button
            icon={<FilePdfOutlined />}
            onClick={onExportPDF}
            disabled={pdfDisabled}
            size="small"
            danger
          >
            PDF
          </Button>
        </Tooltip>

        <Tooltip title="Imprimir">
          <Button
            icon={<PrinterOutlined />}
            onClick={onPrint}
            disabled={printDisabled}
            size="small"
          >
            Imprimir
          </Button>
        </Tooltip>
      </Space>
    </Space>
  );
};

export default memo(ExportButtons);
