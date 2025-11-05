// src/modules/item/dadosCadastrais/components/Main.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, message } from 'antd';
import { ItemSearchResultItem } from '../../search/types/search.types';
import ExportButtons from '../../../../shared/components/ExportButtons';
import { useItemDataCache } from '../../../../shared/contexts/ItemDataContext';
import InformacoesGerais from '../informacoesGerais/components/Main';
import ResultadoTab from '../../../../shared/components/ResultadoTab';
import Dimensoes from '../dimensoes/components/Main';
import Suprimentos from '../suprimentos/components/Main';
import CatalogExportProgressModal from '../../../../shared/components/CatalogExportProgressModal';

// Imports de services
import { itemInformacoesGeraisService } from '../informacoesGerais/services/itemInformacoesGerais.service';
import { dimensoesService } from '../dimensoes/services/dimensoes.service';
// import { suprimentosService } from '../suprimentos/services/suprimentos.service';

// Imports para RESULTADO
import { exportSearchToCSV } from '../../search/utils/export/csv';
import { exportSearchToXLSX } from '../../search/utils/export/xlsx';
import { exportSearchToPDF } from '../../search/utils/export/pdf';
import { printSearch } from '../../search/utils/export/print';

// Imports para BASE
import { exportBaseToCSV } from '../informacoesGerais/utils/export/csv';
import { exportBaseToXLSX } from '../informacoesGerais/utils/export/xlsx';
import { exportBaseToPDF } from '../informacoesGerais/utils/export/pdf';
import { printBase } from '../informacoesGerais/utils/export/print';

// Imports para DIMENSÕES
import { exportDimensoesToCSV } from '../dimensoes/utils/export/csv';
import { exportDimensoesToXLSX } from '../dimensoes/utils/export/xlsx';
import { exportDimensoesToPDF } from '../dimensoes/utils/export/pdf';
import { printDimensoes } from '../dimensoes/utils/export/print';

// Imports para CATÁLOGO
import { CatalogExportService } from '../services/catalogExport.service';
import { exportCatalogToCSV } from '../utils/export/catalogCsv';
import {
  exportCatalogToXLSXSingle,
  exportCatalogToXLSXMultiple,
} from '../utils/export/catalogXlsx';

interface InformacoesGeraisMainProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  itemHeaderVisible: boolean;
}

// Interface para dados pré-carregados
interface PreloadedData {
  informacoesGerais: any | null;
  dimensoes: any | null;
  suprimentos: any | null;
}

const InformacoesGeraisMain: React.FC<InformacoesGeraisMainProps> = ({
  items,
  loading,
  selectedRowKey,
  onRowClick,
  activeTabKey,
  onTabChange,
  onKeyDown,
  itemHeaderVisible,
}) => {
  const { getCachedData, setBulkCachedData, registerLoading, unregisterLoading, isItemChanging } =
    useItemDataCache();

  // Estado para dados pré-carregados
  const [preloadedData, setPreloadedData] = useState<PreloadedData>({
    informacoesGerais: null,
    dimensoes: null,
    suprimentos: null,
  });

  const [loadingAllData, setLoadingAllData] = useState(false);

  // Estado para forçar recarga de dados sempre que componente montar
  const [mountKey, setMountKey] = useState(0);

  // Estado para tracking de loading de cada aba
  const [loadingTabs, setLoadingTabs] = useState({
    base: false,
    dimensoes: false,
    suprimentos: false,
  });

  // Estado para controle de exportação de catálogo
  const [exportMode, setExportMode] = useState<'item' | 'catalog'>('item');
  const [catalogFormat, setCatalogFormat] = useState<'single' | 'multiple'>('single');

  // Estado para modal de progresso de exportação
  const [exportProgress, setExportProgress] = useState({
    visible: false,
    current: 0,
    total: 0,
    operation: 'csv' as 'csv' | 'xlsx',
  });

  // ✅ Calcular selectedItem de forma reativa
  const selectedItem = useMemo(() => {
    // Tentar encontrar na lista de resultados primeiro
    const itemFromList = items.find((item) => item.itemCodigo === selectedRowKey);

    // Se encontrou na lista, retornar
    if (itemFromList) {
      return itemFromList;
    }

    // Se não encontrou (caso drill-down) E há selectedRowKey, criar item mínimo
    if (!itemFromList && selectedRowKey) {
      return {
        itemCodigo: selectedRowKey,
        itemDescricao: preloadedData.informacoesGerais?.itemDescricao || '',
        unidadeMedidaCodigo: '',
        unidadeMedidaDescricao: '',
        familiaCodigo: '',
        familiaDescricao: '',
        familiaComercialCodigo: '',
        familiaComercialDescricao: '',
        grupoEstoqueCodigo: '',
        grupoEstoqueDescricao: '',
        codObsoleto: 0,
        gtin: '',
      };
    }

    // Se não há selectedRowKey, retornar undefined
    return undefined;
  }, [items, selectedRowKey, preloadedData.informacoesGerais]);

  // Incrementar mountKey toda vez que componente montar
  useEffect(() => {
    setMountKey((prev) => prev + 1);
  }, []);

  // Pre-fetch de todas as abas quando item é selecionado
  // ✅ COM CACHE E LOADING SINCRONIZADO: Verifica cache antes de fazer fetch
  // ✅ SEMPRE recarrega quando componente montar (mountKey incrementa a cada mount)
  useEffect(() => {
    const loadAllData = async () => {
      const MODULE_ID = 'dadosCadastrais';

      console.log(
        `[DadosCadastrais] Loading data - mountKey: ${mountKey}, selectedRowKey: ${selectedRowKey}`
      );

      // ✅ REGISTRAR QUE ESTE MÓDULO ESTÁ CARREGANDO
      registerLoading(MODULE_ID);

      // SEMPRE limpar dados primeiro (seja null ou mudança de item)
      setPreloadedData({
        informacoesGerais: null,
        dimensoes: null,
        suprimentos: null,
      });
      setLoadingTabs({
        base: false,
        dimensoes: false,
        suprimentos: false,
      });

      if (!selectedRowKey) {
        // Se não há item selecionado, apenas limpar e retornar
        unregisterLoading(MODULE_ID);
        return;
      }

      // ✅ VERIFICAR CACHE PRIMEIRO
      const cachedInfoGerais = getCachedData(selectedRowKey, 'informacoesGerais');
      const cachedDimensoes = getCachedData(selectedRowKey, 'dimensoes');

      // Se TODOS os dados estão em cache, usar cache (sem fazer fetch)
      if (cachedInfoGerais && cachedDimensoes) {
        setPreloadedData({
          informacoesGerais: cachedInfoGerais,
          dimensoes: cachedDimensoes,
          suprimentos: null,
        });
        setLoadingTabs({
          base: false,
          dimensoes: false,
          suprimentos: false,
        });

        // ✅ DESREGISTRAR LOADING DESTE MÓDULO
        unregisterLoading(MODULE_ID);
        return;
      }

      // ❌ Cache miss ou parcial - fazer fetch
      setLoadingAllData(true);

      // Marcar todas as abas implementadas como loading
      setLoadingTabs({
        base: true,
        dimensoes: true,
        suprimentos: false,
      });

      try {
        // Carregar todas as APIs em paralelo
        const results = await Promise.allSettled([
          itemInformacoesGeraisService.getByCode(selectedRowKey),
          dimensoesService.getByCode(selectedRowKey),
        ]);

        const [infoGerais, dimensoes] = results;

        // Processar resultados
        const newData = {
          informacoesGerais: infoGerais.status === 'fulfilled' ? infoGerais.value : null,
          dimensoes: dimensoes.status === 'fulfilled' ? dimensoes.value : null,
          suprimentos: null,
        };

        setPreloadedData(newData);

        // ✅ ARMAZENAR NO CACHE
        setBulkCachedData(selectedRowKey, newData);

        // Desmarcar loading das abas
        setLoadingTabs({
          base: false,
          dimensoes: false,
          suprimentos: false,
        });

        // Log de erros (opcional)
        if (infoGerais.status === 'rejected') {
          console.error('Erro ao carregar informações gerais:', infoGerais.reason);
        }
        if (dimensoes.status === 'rejected') {
          console.error('Erro ao carregar dimensões:', dimensoes.reason);
        }
      } catch (error) {
        console.error('Erro ao pré-carregar dados:', error);
        message.error('Erro ao carregar dados do item');

        // Desmarcar loading em caso de erro
        setLoadingTabs({
          base: false,
          dimensoes: false,
          suprimentos: false,
        });
      } finally {
        setLoadingAllData(false);
        // ✅ DESREGISTRAR LOADING DESTE MÓDULO
        unregisterLoading('dadosCadastrais');
      }
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRowKey, mountKey]);

  // Reset export mode quando sair da aba 'resultado'
  useEffect(() => {
    if (activeTabKey !== 'resultado') {
      setExportMode('item');
    }
  }, [activeTabKey]);

  // Funções de exportação de catálogo
  const handleCatalogExportCSV = async () => {
    try {
      // Show progress modal
      setExportProgress({ visible: true, current: 0, total: items.length, operation: 'csv' });

      // Fetch all data with progress updates
      const completeData = await CatalogExportService.fetchAllItemsData(items, (current, total) => {
        setExportProgress({ visible: true, current, total, operation: 'csv' });
      });

      // Hide progress modal
      setExportProgress({ visible: false, current: 0, total: 0, operation: 'csv' });

      // Export to CSV
      exportCatalogToCSV(completeData, 'catalogo_itens');
      message.success(`Catálogo exportado com sucesso! ${completeData.length} itens`);
    } catch (error) {
      console.error('Erro ao exportar catálogo CSV:', error);
      setExportProgress({ visible: false, current: 0, total: 0, operation: 'csv' });
      message.error('Erro ao exportar catálogo');
    }
  };

  const handleCatalogExportXLSX = async (format: 'single' | 'multiple') => {
    try {
      // Show progress modal
      setExportProgress({ visible: true, current: 0, total: items.length, operation: 'xlsx' });

      // Fetch all data with progress updates
      const completeData = await CatalogExportService.fetchAllItemsData(items, (current, total) => {
        setExportProgress({ visible: true, current, total, operation: 'xlsx' });
      });

      // Hide progress modal
      setExportProgress({ visible: false, current: 0, total: 0, operation: 'xlsx' });

      // Export to XLSX (single or multiple sheets)
      if (format === 'single') {
        exportCatalogToXLSXSingle(completeData, 'catalogo_itens');
      } else {
        exportCatalogToXLSXMultiple(completeData, 'catalogo_itens');
      }

      message.success(`Catálogo exportado com sucesso! ${completeData.length} itens`);
    } catch (error) {
      console.error('Erro ao exportar catálogo XLSX:', error);
      setExportProgress({ visible: false, current: 0, total: 0, operation: 'xlsx' });
      message.error('Erro ao exportar catálogo');
    }
  };

  const handleExportCSV = async () => {
    // Verificar se está em modo catálogo na aba resultado
    if (exportMode === 'catalog' && activeTabKey === 'resultado') {
      await handleCatalogExportCSV();
      return;
    }

    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToCSV(items, 'resultado_pesquisa');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'base' && selectedItem) {
      exportBaseToCSV(selectedItem, 'item_base');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'dimensoes' && preloadedData.dimensoes) {
      exportDimensoesToCSV(preloadedData.dimensoes, 'item_dimensoes');
      message.success('CSV exportado com sucesso!');
    } else {
      const tabName = activeTabKey.charAt(0).toUpperCase() + activeTabKey.slice(1);
      message.info(
        `Exportação CSV da aba "${tabName}" será implementada quando houver dados da API`
      );
    }
  };

  const handleExportXLSX = async () => {
    // Verificar se está em modo catálogo na aba resultado
    if (exportMode === 'catalog' && activeTabKey === 'resultado') {
      await handleCatalogExportXLSX(catalogFormat);
      return;
    }

    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToXLSX(items, 'resultado_pesquisa');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'base' && selectedItem) {
      exportBaseToXLSX(selectedItem, 'item_base');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'dimensoes' && preloadedData.dimensoes) {
      exportDimensoesToXLSX(preloadedData.dimensoes, 'item_dimensoes');
      message.success('Excel exportado com sucesso!');
    } else {
      const tabName = activeTabKey.charAt(0).toUpperCase() + activeTabKey.slice(1);
      message.info(
        `Exportação Excel da aba "${tabName}" será implementada quando houver dados da API`
      );
    }
  };

  const handleExportPDF = async () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToPDF(items, 'resultado_pesquisa');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'base' && selectedItem) {
      exportBaseToPDF(selectedItem, 'item_base');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'dimensoes' && preloadedData.dimensoes) {
      exportDimensoesToPDF(preloadedData.dimensoes, 'item_dimensoes');
      message.success('PDF gerado com sucesso!');
    } else {
      const tabName = activeTabKey.charAt(0).toUpperCase() + activeTabKey.slice(1);
      message.info(
        `Exportação PDF da aba "${tabName}" será implementada quando houver dados da API`
      );
    }
  };

  const handlePrint = async () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      printSearch(items);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'base' && selectedItem) {
      printBase(selectedItem);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'dimensoes' && preloadedData.dimensoes) {
      printDimensoes(preloadedData.dimensoes);
      message.success('Abrindo janela de impressão...');
    } else {
      const tabName = activeTabKey.charAt(0).toUpperCase() + activeTabKey.slice(1);
      message.info(`Impressão da aba "${tabName}" será implementada quando houver dados da API`);
    }
  };

  // Componente de indicador de loading para as abas
  const LoadingIndicator = () => <span className="tab-loading-dot"></span>;

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
          {loadingTabs.base && <LoadingIndicator />}
          <span className="tab-shortcut-hint">Alt+2</span>
        </span>
      ),
      children: (
        <InformacoesGerais
          itemCodigo={selectedRowKey}
          preloadedData={preloadedData.informacoesGerais}
          isItemChanging={isItemChanging}
        />
      ),
    },
    {
      key: 'dimensoes',
      label: (
        <span className="tab-with-shortcut">
          Dimensões
          {loadingTabs.dimensoes && <LoadingIndicator />}
          <span className="tab-shortcut-hint">Alt+3</span>
        </span>
      ),
      children: <Dimensoes selectedItem={selectedItem} preloadedData={preloadedData.dimensoes} />,
    },
    {
      key: 'suprimentos',
      label: (
        <span className="tab-with-shortcut">
          Suprimentos
          {loadingTabs.suprimentos && <LoadingIndicator />}
          <span className="tab-shortcut-hint">Alt+4</span>
        </span>
      ),
      children: (
        <Suprimentos
          selectedItem={selectedItem}
          // preloadedData será adicionado quando suprimentosService estiver pronto
        />
      ),
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

        /* Indicador de loading nas abas */
        .tab-loading-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-left: 6px;
          margin-right: 2px;
          border-radius: 50%;
          background-color: #1890ff;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.8);
          }
        }

        /* CSS para permitir rolagem nas abas */
        .dados-cadastrais-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .dados-cadastrais-container .ant-tabs {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .dados-cadastrais-container .ant-tabs-content-holder {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }

        .dados-cadastrais-container .ant-tabs-content {
          height: 100%;
        }

        .dados-cadastrais-container .ant-tabs-tabpane {
          height: auto;
          min-height: 100%;
        }

        /* Estilização da barra de rolagem */
        .dados-cadastrais-container .ant-tabs-content-holder::-webkit-scrollbar {
          width: 8px;
        }

        .dados-cadastrais-container .ant-tabs-content-holder::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .dados-cadastrais-container .ant-tabs-content-holder::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .dados-cadastrais-container .ant-tabs-content-holder::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="dados-cadastrais-container">
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
              disabled={loading || loadingAllData}
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

      {/* Modal de progresso para exportação de catálogo */}
      <CatalogExportProgressModal
        visible={exportProgress.visible}
        current={exportProgress.current}
        total={exportProgress.total}
        operation={exportProgress.operation}
        format={catalogFormat}
      />
    </>
  );
};

export default InformacoesGeraisMain;
