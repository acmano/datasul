// src/modules/fiscal/components/Main.tsx

import React, { useState } from 'react';
import { Tabs, message } from 'antd';
import { ItemSearchResultItem } from '../../item/search/types/search.types';
import ResultadoTab from '../../../shared/components/ResultadoTab';
import FiscalBase from '../base/components/Main';
import ExportButtons from '../../../shared/components/ExportButtons';

// Imports para RESULTADO (search exports)
import { exportSearchToCSV } from '../../item/search/utils/export/csv';
import { exportSearchToXLSX } from '../../item/search/utils/export/xlsx';
import { exportSearchToPDF } from '../../item/search/utils/export/pdf';
import { printSearch } from '../../item/search/utils/export/print';

// Imports para BASE (fiscal exports)
import { exportFiscalToCSV } from '../base/utils/export/csv';
import { exportFiscalToXLSX } from '../base/utils/export/xlsx';
import { exportFiscalToPDF } from '../base/utils/export/pdf';
import { printFiscal } from '../base/utils/export/print';

interface FiscalMainProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  itemHeaderVisible: boolean;
}

const FiscalMain: React.FC<FiscalMainProps> = ({
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

  // Estado para dados fiscais (será preenchido pela aba Base)
  const [fiscalData, setFiscalData] = useState<any | null>(null);

  // Funções de exportação
  const handleExportCSV = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToCSV(items, 'fiscal_resultado');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'base' && fiscalData) {
      exportFiscalToCSV(fiscalData, 'fiscal_base');
      message.success('CSV exportado com sucesso!');
    } else {
      message.info('Selecione um item para exportar os dados fiscais');
    }
  };

  const handleExportXLSX = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToXLSX(items, 'fiscal_resultado');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'base' && fiscalData) {
      exportFiscalToXLSX(fiscalData, 'fiscal_base');
      message.success('Excel exportado com sucesso!');
    } else {
      message.info('Selecione um item para exportar os dados fiscais');
    }
  };

  const handleExportPDF = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToPDF(items, 'fiscal_resultado');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'base' && fiscalData) {
      exportFiscalToPDF(fiscalData, 'fiscal_base');
      message.success('PDF gerado com sucesso!');
    } else {
      message.info('Selecione um item para exportar os dados fiscais');
    }
  };

  const handlePrint = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      printSearch(items);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'base' && fiscalData) {
      printFiscal(fiscalData);
      message.success('Abrindo janela de impressão...');
    } else {
      message.info('Selecione um item para imprimir os dados fiscais');
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
      children: <FiscalBase selectedItem={selectedItem} onDataLoaded={setFiscalData} />,
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
        .fiscal-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .fiscal-container .ant-tabs {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .fiscal-container .ant-tabs-content-holder {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }

        .fiscal-container .ant-tabs-content {
          height: 100%;
        }

        .fiscal-container .ant-tabs-tabpane {
          height: auto;
          min-height: 100%;
        }

        /* Estilização da barra de rolagem */
        .fiscal-container .ant-tabs-content-holder::-webkit-scrollbar {
          width: 8px;
        }

        .fiscal-container .ant-tabs-content-holder::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .fiscal-container .ant-tabs-content-holder::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .fiscal-container .ant-tabs-content-holder::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="fiscal-container">
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

export default FiscalMain;
