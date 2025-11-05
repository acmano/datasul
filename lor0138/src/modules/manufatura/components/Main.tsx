// src/modules/manufatura/components/Main.tsx

import React, { useState } from 'react';
import { Tabs, message } from 'antd';
import { ItemSearchResultItem } from '../../item/search/types/search.types';
import ResultadoTab from '../../../shared/components/ResultadoTab';
import ManufaturaBase from '../base/components/Main';
import ExportButtons from '../../../shared/components/ExportButtons';

// Imports para RESULTADO tab (search results)
import { exportSearchToCSV } from '../../item/search/utils/export/csv';
import { exportSearchToXLSX } from '../../item/search/utils/export/xlsx';
import { exportSearchToPDF } from '../../item/search/utils/export/pdf';
import { printSearch } from '../../item/search/utils/export/print';

// Imports para BASE tab (manufatura data)
import { exportManufaturaToCSV } from '../base/utils/export/csv';
import { exportManufaturaToXLSX } from '../base/utils/export/xlsx';
import { exportManufaturaToPDF } from '../base/utils/export/pdf';
import { printManufatura } from '../base/utils/export/print';

interface ManufaturaMainProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  itemHeaderVisible: boolean;
}

const ManufaturaMain: React.FC<ManufaturaMainProps> = ({
  items,
  loading,
  selectedRowKey,
  onRowClick,
  activeTabKey,
  onTabChange,
  onKeyDown,
  itemHeaderVisible,
}) => {
  const selectedItem = items.find((item) => item.itemCodigo === selectedRowKey);

  // Estado para controle de exportação
  const [exportMode, setExportMode] = useState<'item' | 'catalog'>('item');
  const [catalogFormat, setCatalogFormat] = useState<'single' | 'multiple'>('single');

  // Estado para armazenar dados de manufatura carregados na aba Base
  const [manufaturaData, setManufaturaData] = useState<any>(null);

  // Handlers de exportação
  const handleExportCSV = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToCSV(items, 'manufatura_resultado');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'base' && manufaturaData) {
      exportManufaturaToCSV(manufaturaData, 'manufatura_base');
      message.success('CSV exportado com sucesso!');
    } else {
      message.info('Nenhum dado disponível para exportação');
    }
  };

  const handleExportXLSX = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToXLSX(items, 'manufatura_resultado');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'base' && manufaturaData) {
      exportManufaturaToXLSX(manufaturaData, 'manufatura_base');
      message.success('Excel exportado com sucesso!');
    } else {
      message.info('Nenhum dado disponível para exportação');
    }
  };

  const handleExportPDF = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToPDF(items, 'manufatura_resultado');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'base' && manufaturaData) {
      exportManufaturaToPDF(manufaturaData, 'manufatura_base');
      message.success('PDF gerado com sucesso!');
    } else {
      message.info('Nenhum dado disponível para exportação');
    }
  };

  const handlePrint = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      printSearch(items);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'base' && manufaturaData) {
      printManufatura(manufaturaData);
      message.success('Abrindo janela de impressão...');
    } else {
      message.info('Nenhum dado disponível para impressão');
    }
  };

  const tabItems = [
    {
      key: 'resultado',
      label: (
        <span className="tab-with-shortcut">
          Resultado
          <span className="tab-shortcut-hint">Alt+1</span>
        </span>
      ),
      children: (
        <ResultadoTab
          items={items}
          loading={loading}
          selectedRowKey={selectedRowKey}
          onRowClick={onRowClick}
          onKeyDown={onKeyDown}
          activeTabKey={activeTabKey}
        />
      ),
    },
    {
      key: 'base',
      label: (
        <span className="tab-with-shortcut">
          Base
          <span className="tab-shortcut-hint">Alt+2</span>
        </span>
      ),
      children: <ManufaturaBase selectedItem={selectedItem} onDataLoaded={setManufaturaData} />,
    },
  ];

  return (
    <>
      <style>{`
        /* Atalhos de teclado nas abas */
        .tab-with-shortcut {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .tab-shortcut-hint {
          font-size: 11px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .ant-tabs-tab:hover .tab-shortcut-hint,
        .ant-tabs-tab-active .tab-shortcut-hint {
          opacity: 0.6;
        }

        /* CSS para permitir rolagem nas abas */
        .manufatura-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .manufatura-container .ant-tabs {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .manufatura-container .ant-tabs-content-holder {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }

        .manufatura-container .ant-tabs-content {
          height: 100%;
        }

        .manufatura-container .ant-tabs-tabpane {
          height: auto;
          min-height: 100%;
        }

        /* Estilização da barra de rolagem */
        .manufatura-container .ant-tabs-content-holder::-webkit-scrollbar {
          width: 8px;
        }

        .manufatura-container .ant-tabs-content-holder::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .manufatura-container .ant-tabs-content-holder::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .manufatura-container .ant-tabs-content-holder::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="manufatura-container">
        <Tabs
          activeKey={activeTabKey}
          onChange={onTabChange}
          items={tabItems}
          style={{ marginBottom: 0 }}
          tabBarStyle={{ marginBottom: 0, flexShrink: 0 }}
          tabBarExtraContent={
            <ExportButtons
              onExportCSV={handleExportCSV}
              onExportXLSX={handleExportXLSX}
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
              disabled={loading}
              hasData={items.length > 0}
              showModeToggle={activeTabKey === 'resultado'}
              exportMode={exportMode}
              onExportModeChange={setExportMode}
              catalogFormat={catalogFormat}
              onCatalogFormatChange={setCatalogFormat}
            />
          }
        />
      </div>
    </>
  );
};

export default ManufaturaMain;
