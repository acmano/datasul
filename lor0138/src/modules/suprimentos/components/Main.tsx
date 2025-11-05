// src/modules/suprimentos/components/Main.tsx

import React, { useState } from 'react';
import { Tabs, message } from 'antd';
import { ItemSearchResultItem } from '../../item/search/types/search.types';
import ResultadoTab from '../../../shared/components/ResultadoTab';
import ExportButtons from '../../../shared/components/ExportButtons';
import Base from './base/components/Main';
import Estoque from './estoque/components/Main';
import Movimento from './movimento/components/Main';
import Fornecedores from './fornecedores/components/Main';
import ProgramacaoEntrega from './programacaoEntrega/components/Main';

// Imports for RESULTADO tab (search results)
import { exportSearchToCSV } from '../../item/search/utils/export/csv';
import { exportSearchToXLSX } from '../../item/search/utils/export/xlsx';
import { exportSearchToPDF } from '../../item/search/utils/export/pdf';
import { printSearch } from '../../item/search/utils/export/print';

interface SuprimentosMainProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  itemHeaderVisible: boolean;
}

const SuprimentosMain: React.FC<SuprimentosMainProps> = ({
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

  // Estado para armazenar dados carregados nas abas
  const [baseData, setBaseData] = useState<any>(null);
  const [estoqueData, setEstoqueData] = useState<any>(null);
  const [movimentoData, setMovimentoData] = useState<any>(null);
  const [fornecedoresData, setFornecedoresData] = useState<any>(null);
  const [programacaoData, setProgramacaoData] = useState<any>(null);

  // Funções de exportação
  const handleExportCSV = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToCSV(items, 'suprimentos_resultado');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'base' && baseData) {
      // TODO: Implement base export when data structure is available
      message.info('Exportação de dados base será implementada quando houver dados');
    } else if (activeTabKey === 'estoque' && estoqueData) {
      // TODO: Implement estoque export when data structure is available
      message.info('Exportação de estoque será implementada quando houver dados');
    } else if (activeTabKey === 'movimento' && movimentoData) {
      // TODO: Implement movimento export when data structure is available
      message.info('Exportação de movimento será implementada quando houver dados');
    } else if (activeTabKey === 'fornecedores' && fornecedoresData) {
      // TODO: Implement fornecedores export when data structure is available
      message.info('Exportação de fornecedores será implementada quando houver dados');
    } else if (activeTabKey === 'programacao-entrega' && programacaoData) {
      // TODO: Implement programacao export when data structure is available
      message.info('Exportação de programação será implementada quando houver dados');
    } else {
      message.info('Nenhum dado disponível para exportação');
    }
  };

  const handleExportXLSX = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToXLSX(items, 'suprimentos_resultado');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'base' && baseData) {
      message.info('Exportação de dados base será implementada quando houver dados');
    } else if (activeTabKey === 'estoque' && estoqueData) {
      message.info('Exportação de estoque será implementada quando houver dados');
    } else if (activeTabKey === 'movimento' && movimentoData) {
      message.info('Exportação de movimento será implementada quando houver dados');
    } else if (activeTabKey === 'fornecedores' && fornecedoresData) {
      message.info('Exportação de fornecedores será implementada quando houver dados');
    } else if (activeTabKey === 'programacao-entrega' && programacaoData) {
      message.info('Exportação de programação será implementada quando houver dados');
    } else {
      message.info('Nenhum dado disponível para exportação');
    }
  };

  const handleExportPDF = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToPDF(items, 'suprimentos_resultado');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'base' && baseData) {
      message.info('Exportação de dados base será implementada quando houver dados');
    } else if (activeTabKey === 'estoque' && estoqueData) {
      message.info('Exportação de estoque será implementada quando houver dados');
    } else if (activeTabKey === 'movimento' && movimentoData) {
      message.info('Exportação de movimento será implementada quando houver dados');
    } else if (activeTabKey === 'fornecedores' && fornecedoresData) {
      message.info('Exportação de fornecedores será implementada quando houver dados');
    } else if (activeTabKey === 'programacao-entrega' && programacaoData) {
      message.info('Exportação de programação será implementada quando houver dados');
    } else {
      message.info('Nenhum dado disponível para exportação');
    }
  };

  const handlePrint = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      printSearch(items);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'base' && baseData) {
      message.info('Impressão de dados base será implementada quando houver dados');
    } else if (activeTabKey === 'estoque' && estoqueData) {
      message.info('Impressão de estoque será implementada quando houver dados');
    } else if (activeTabKey === 'movimento' && movimentoData) {
      message.info('Impressão de movimento será implementada quando houver dados');
    } else if (activeTabKey === 'fornecedores' && fornecedoresData) {
      message.info('Impressão de fornecedores será implementada quando houver dados');
    } else if (activeTabKey === 'programacao-entrega' && programacaoData) {
      message.info('Impressão de programação será implementada quando houver dados');
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
      children: <Base itemCodigo={selectedRowKey} loading={false} />,
    },
    {
      key: 'estoque',
      label: (
        <span className="tab-with-shortcut">
          Estoque
          <span className="tab-shortcut-hint">Alt+3</span>
        </span>
      ),
      children: <Estoque itemCodigo={selectedRowKey} loading={false} />,
    },
    {
      key: 'movimento',
      label: (
        <span className="tab-with-shortcut">
          Movimento
          <span className="tab-shortcut-hint">Alt+4</span>
        </span>
      ),
      children: <Movimento itemCodigo={selectedRowKey} loading={false} />,
    },
    {
      key: 'fornecedores',
      label: (
        <span className="tab-with-shortcut">
          Fornecedores
          <span className="tab-shortcut-hint">Alt+5</span>
        </span>
      ),
      children: <Fornecedores itemCodigo={selectedRowKey} loading={false} />,
    },
    {
      key: 'programacao-entrega',
      label: (
        <span className="tab-with-shortcut">
          Programação de Entrega
          <span className="tab-shortcut-hint">Alt+6</span>
        </span>
      ),
      children: <ProgramacaoEntrega itemCodigo={selectedRowKey} loading={false} />,
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
        .suprimentos-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .suprimentos-container .ant-tabs {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .suprimentos-container .ant-tabs-content-holder {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }

        .suprimentos-container .ant-tabs-content {
          height: 100%;
        }

        .suprimentos-container .ant-tabs-tabpane {
          height: auto;
          min-height: 100%;
        }

        /* Estilização da barra de rolagem */
        .suprimentos-container .ant-tabs-content-holder::-webkit-scrollbar {
          width: 8px;
        }

        .suprimentos-container .ant-tabs-content-holder::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .suprimentos-container .ant-tabs-content-holder::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .suprimentos-container .ant-tabs-content-holder::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="suprimentos-container">
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

export default SuprimentosMain;
