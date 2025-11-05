// src/modules/pcp/components/Main.tsx

import React, { useState, useEffect } from 'react';
import { Tabs, message } from 'antd';
import { ItemSearchResultItem } from '../../item/search/types/search.types';
import ExportButtons from '../../../shared/components/ExportButtons';
import ResultadoTab from '../../../shared/components/ResultadoTab';
import Planejamento from '../base/planejamento/components/Main';

// Imports for RESULTADO tab
import { exportSearchToCSV } from '../../item/search/utils/export/csv';
import { exportSearchToXLSX } from '../../item/search/utils/export/xlsx';
import { exportSearchToPDF } from '../../item/search/utils/export/pdf';
import { printSearch } from '../../item/search/utils/export/print';

// Imports for BASE tab (planejamento)
import { exportPlanejamentoToCSV } from '../base/planejamento/utils/export/csv';
import { exportPlanejamentoToXLSX } from '../base/planejamento/utils/export/xlsx';
import { exportPlanejamentoToPDF } from '../base/planejamento/utils/export/pdf';
import { printPlanejamento } from '../base/planejamento/utils/export/print';

interface PCPMainProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  itemHeaderVisible: boolean;
}

const PCPMain: React.FC<PCPMainProps> = ({
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

  // Reset export mode quando sair da aba 'resultado'
  useEffect(() => {
    if (activeTabKey !== 'resultado') {
      setExportMode('item');
    }
  }, [activeTabKey]);

  // Funções de exportação
  const handleExportCSV = async () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToCSV(items, 'resultado_pesquisa_pcp');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'base' && selectedItem) {
      // For planejamento, we need the full data and estabelecimento code
      // TODO: This needs planejamento data - will be implemented when data is available
      message.info('Exportação de planejamento será implementada quando houver dados');
    } else {
      message.warning('Nenhum dado disponível para exportar');
    }
  };

  const handleExportXLSX = async () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToXLSX(items, 'resultado_pesquisa_pcp');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'base' && selectedItem) {
      message.info('Exportação de planejamento será implementada quando houver dados');
    } else {
      message.warning('Nenhum dado disponível para exportar');
    }
  };

  const handleExportPDF = async () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToPDF(items, 'resultado_pesquisa_pcp');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'base' && selectedItem) {
      message.info('Exportação de planejamento será implementada quando houver dados');
    } else {
      message.warning('Nenhum dado disponível para exportar');
    }
  };

  const handlePrint = async () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      printSearch(items);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'base' && selectedItem) {
      message.info('Impressão de planejamento será implementada quando houver dados');
    } else {
      message.warning('Nenhum dado disponível para imprimir');
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
      children: <Planejamento selectedItem={selectedItem} />,
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
        .pcp-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .pcp-container .ant-tabs {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .pcp-container .ant-tabs-content-holder {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }

        .pcp-container .ant-tabs-content {
          height: 100%;
        }

        .pcp-container .ant-tabs-tabpane {
          height: auto;
          min-height: 100%;
        }

        /* Estilização da barra de rolagem */
        .pcp-container .ant-tabs-content-holder::-webkit-scrollbar {
          width: 8px;
        }

        .pcp-container .ant-tabs-content-holder::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .pcp-container .ant-tabs-content-holder::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .pcp-container .ant-tabs-content-holder::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="pcp-container">
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

export default PCPMain;
