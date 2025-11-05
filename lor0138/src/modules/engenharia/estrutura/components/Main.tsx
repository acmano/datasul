// src/modules/engenharia/estrutura/components/Main.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, message, Layout, Spin, Switch, Space, Typography } from 'antd';
import { useItemDataCache } from '../../../../shared/contexts/ItemDataContext';
import { ItemSearchResultItem } from '../../../item/search/types/search.types';
import ResultadoTab from '../../../../shared/components/ResultadoTab';
import ExportButtons from '../../../../shared/components/ExportButtons';
import { BreadcrumbItem } from './Breadcrumb';
import ControlPanel from './ControlPanel';

// Imports de exportação para Resultado
import { exportSearchToCSV } from '../../../item/search/utils/export/csv';
import { exportSearchToXLSX } from '../../../item/search/utils/export/xlsx';
import { exportSearchToPDF } from '../../../item/search/utils/export/pdf';
import { printSearch } from '../../../item/search/utils/export/print';

// Imports de exportação para Estrutura
import { exportEstruturaToCSV } from '../utils/export/csv';
import { exportEstruturaToXLSX } from '../utils/export/xlsx';
import { exportEstruturaToPDF } from '../utils/export/pdf';
import { printEstrutura } from '../utils/export/print';

// Imports de exportação para Onde Usado
import { exportOndeUsadoToCSV } from '../utils/ondeUsadoExport/csv';
import { exportOndeUsadoToXLSX } from '../utils/ondeUsadoExport/xlsx';
import { exportOndeUsadoToPDF } from '../utils/ondeUsadoExport/pdf';
import { printOndeUsado } from '../utils/ondeUsadoExport/print';

import MenuLateralEstrutura from './MenuLateralEstrutura';
import VisualizationContent from './VisualizationContent';
import ListaFinais from './ListaFinais';
import { estruturaService } from '../services/estrutura.service';
import { ondeUsadoService } from '../services/ondeUsado.service';
import { ItemPrincipal, TreeNode, TipoEstrutura, ModoApresentacao } from '../types/estrutura.types';
import { ItemPrincipalOndeUsado, TreeNodeOndeUsado, ItemFinal } from '../types/ondeUsado.types';
import { adaptToTree, propagarQuantidades, sumarizarEstrutura } from '../utils/dataProcessing';
import {
  adaptOndeUsadoToTree,
  propagarQuantidadesOndeUsado,
  sumarizarOndeUsado,
} from '../utils/ondeUsadoDataProcessing';
import { hexToHsl, makeLevelHslGradient, hslToCss, contrastTextForHsl } from '../utils/colorUtils';
import { useTheme } from '../../../../shared/contexts/ThemeContext';
import ListaSumarizada from './ListaSumarizada';

// Services para pré-fetch de abas de Dados Mestres
import { itemInformacoesGeraisService } from '../../../item/dadosCadastrais/informacoesGerais/services/itemInformacoesGerais.service';
import { dimensoesService } from '../../../item/dadosCadastrais/dimensoes/services/dimensoes.service';
import { planejamentoService } from '../../../item/dadosCadastrais/planejamento/services/planejamento.service';
import { manufaturaService } from '../../../item/dadosCadastrais/manufatura/services/manufatura.service';
import { fiscalService } from '../../../item/dadosCadastrais/fiscal/services/fiscal.service';
import { itemSearchService } from '../../../item/search/services/itemSearch.service';

const { Sider, Content } = Layout;

interface EngenhariaMainProps {
  items: ItemSearchResultItem[];
  loading: boolean;
  selectedRowKey: string | null;
  onRowClick: (record: ItemSearchResultItem) => void;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  activeVisualizacao: string;
  onVisualizacaoChange: (key: string) => void;
  menuSecundarioVisible: boolean;
  onToggleMenuSecundario: () => void;
  breadcrumb: BreadcrumbItem[];
  onBreadcrumbChange: (breadcrumb: BreadcrumbItem[]) => void;
  itemHeaderVisible: boolean;
  navigateToItem?: (codigo: string, tab?: string) => void;
  familias?: Array<{ value: string; label: string }>;
  familiasComerciais?: Array<{ value: string; label: string }>;
  gruposDeEstoque?: Array<{ value: string; label: string }>;
}

const EngenhariaMain: React.FC<EngenhariaMainProps> = ({
  items,
  loading,
  selectedRowKey,
  onRowClick,
  activeTabKey,
  onTabChange,
  onKeyDown,
  activeVisualizacao,
  onVisualizacaoChange,
  menuSecundarioVisible,
  onToggleMenuSecundario,
  breadcrumb,
  onBreadcrumbChange,
  itemHeaderVisible,
  navigateToItem,
  familias = [],
  familiasComerciais = [],
  gruposDeEstoque = [],
}) => {
  const { theme } = useTheme();
  const {
    getCachedData,
    setCachedData,
    setBulkCachedData,
    isItemChanging,
    registerLoading,
    unregisterLoading,
  } = useItemDataCache();

  // Estado dos dados da estrutura
  const [estruturaData, setEstruturaData] = useState<ItemPrincipal | null>(null);
  const [loadingEstrutura, setLoadingEstrutura] = useState(false);

  // Estado dos dados de Onde Usado
  const [ondeUsadoData, setOndeUsadoData] = useState<ItemPrincipalOndeUsado | null>(null);
  const [loadingOndeUsado, setLoadingOndeUsado] = useState(false);

  // Estado para modo "Finais Onde Usado"
  const [modoFinaisApenas, setModoFinaisApenas] = useState<boolean>(false);
  const [listaFinais, setListaFinais] = useState<ItemFinal[] | null>(null);

  // Estado de navegação drill-down
  const [isDrillDownLoading, setIsDrillDownLoading] = useState(false);

  // Controles de data e histórico
  const [dataReferencia, setDataReferencia] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  // Estados para estrutura de consumo
  const [tipoEstrutura, setTipoEstrutura] = useState<TipoEstrutura>('engenharia');
  const [quantidadeMultiplicador, setQuantidadeMultiplicador] = useState<number>(1);
  const [modoApresentacao, setModoApresentacao] = useState<ModoApresentacao>('estrutura');

  // Controles
  const [showQty, setShowQty] = useState(true);
  const [baseHex, setBaseHex] = useState('#1e88e5');
  // ✅ Cor de fundo baseada no tema
  const [bgColor, setBgColor] = useState(theme === 'dark' ? '#1f1f1f' : '#ffffff');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Estado para controle do nível de expansão da tabela
  const [maxExpandLevel, setMaxExpandLevel] = useState<number>(1);

  // Estado para controle de exportação
  const [exportMode, setExportMode] = useState<'item' | 'catalog'>('item');
  const [catalogFormat, setCatalogFormat] = useState<'single' | 'multiple'>('single');

  // Sincronizar bgColor com mudanças de tema
  useEffect(() => {
    setBgColor(theme === 'dark' ? '#1f1f1f' : '#ffffff');
  }, [theme]);

  // Processar dados, marcar validade e filtrar se necessário
  const tree: TreeNode | null = useMemo(() => {
    // Função para verificar se um componente é válido na data de referência
    const isComponentValid = (node: TreeNode): boolean => {
      const dataRef = dataReferencia;
      const inicio = node.dataInicio;
      const fim = node.dataFim;

      const validoInicio = !inicio || inicio <= dataRef;
      const validoFim = !fim || fim >= dataRef;

      return validoInicio && validoFim;
    };
    if (!estruturaData) {
      return null;
    }

    // 🔍 PERFORMANCE: Medir tempo de processamento
    const processStart = performance.now();
    const result = adaptToTree(estruturaData);
    const processEnd = performance.now();
    const processDuration = processEnd - processStart;

    // Performance tracking silenced
    void processDuration; // Mark as used

    // Marcar validade e filtrar se necessário
    const processTree = (node: TreeNode): TreeNode | null => {
      const valid = isComponentValid(node);

      // Processar filhos recursivamente
      const processedChildren = node.children
        .map((child) => processTree(child))
        .filter((child): child is TreeNode => child !== null);

      // Se não mostrar histórico e não é válido, filtrar este nó
      if (!mostrarHistorico && !valid && node.nivel > 0) {
        return null;
      }

      return {
        ...node,
        isValid: valid,
        children: processedChildren,
      };
    };

    const processedTree = processTree(result);
    return processedTree;
  }, [estruturaData, mostrarHistorico, dataReferencia]);

  // Aplicar propagação de quantidades quando em modo Consumo
  const estruturaProcessada: TreeNode | null = useMemo(() => {
    if (!tree) {
      return null;
    }

    if (tipoEstrutura === 'consumo') {
      return propagarQuantidades(tree, quantidadeMultiplicador);
    }

    return tree;
  }, [tree, tipoEstrutura, quantidadeMultiplicador]);

  // Processar dados de Onde Usado (similar à estrutura)
  const treeOndeUsado: TreeNodeOndeUsado | null = useMemo(() => {
    if (!ondeUsadoData) {
      return null;
    }

    const result = adaptOndeUsadoToTree(ondeUsadoData);

    // Marcar validade
    const processTree = (node: TreeNodeOndeUsado): TreeNodeOndeUsado | null => {
      const dataRef = dataReferencia;
      const inicio = node.dataInicio;
      const fim = node.dataFim;
      const validoInicio = !inicio || inicio <= dataRef;
      const validoFim = !fim || fim >= dataRef;
      const valid = validoInicio && validoFim;

      const processedChildren = node.children
        .map((child) => processTree(child))
        .filter((child): child is TreeNodeOndeUsado => child !== null);

      if (!mostrarHistorico && !valid && node.nivel > 0) {
        return null;
      }

      return {
        ...node,
        isValid: valid,
        children: processedChildren,
      };
    };

    return processTree(result);
  }, [ondeUsadoData, mostrarHistorico, dataReferencia]);

  // Aplicar propagação em Onde Usado (se modo consumo)
  const ondeUsadoProcessado: TreeNodeOndeUsado | null = useMemo(() => {
    if (!treeOndeUsado) {
      return null;
    }

    if (tipoEstrutura === 'consumo') {
      return propagarQuantidadesOndeUsado(treeOndeUsado, quantidadeMultiplicador);
    }

    return treeOndeUsado;
  }, [treeOndeUsado, tipoEstrutura, quantidadeMultiplicador]);

  // Gerar lista sumarizada quando em modo Lista
  const listaSumarizada = useMemo(() => {
    if (tipoEstrutura === 'consumo' && modoApresentacao === 'lista' && estruturaProcessada) {
      return sumarizarEstrutura(estruturaProcessada);
    }
    return null;
  }, [tipoEstrutura, modoApresentacao, estruturaProcessada]);

  // Gerar lista sumarizada de Onde Usado
  const listaSumarizadaOndeUsado = useMemo(() => {
    if (tipoEstrutura === 'consumo' && modoApresentacao === 'lista' && ondeUsadoProcessado) {
      return sumarizarOndeUsado(ondeUsadoProcessado);
    }
    return null;
  }, [tipoEstrutura, modoApresentacao, ondeUsadoProcessado]);

  const flat = useMemo(() => {
    if (!estruturaProcessada) {
      return [];
    }
    const result: any[] = [];
    const walk = (node: TreeNode, level: number, path: string[]) => {
      const id = [...path, node.code].join('>');
      result.push({ ...node, id, level });
      node.children.forEach((ch) => walk(ch, level + 1, [...path, node.code]));
    };
    walk(estruturaProcessada, 0, []);
    return result;
  }, [estruturaProcessada]);

  const maxLevel = useMemo(() => {
    if (!flat.length) {
      return 0;
    }
    return Math.max(...flat.map((n: any) => n.level));
  }, [flat]);

  // Calcular nível máximo da estrutura (excluindo nível 0)
  const maxLevelExcludingRoot = useMemo(() => {
    if (!flat.length) {
      return 1;
    }
    const levels = flat.filter((n: any) => n.level > 0).map((n: any) => n.level);
    return levels.length > 0 ? Math.max(...levels) : 1;
  }, [flat]);

  // Funções de cor
  const baseHsl = useMemo(() => hexToHsl(baseHex), [baseHex]);
  const getLevelHsl = useMemo(() => makeLevelHslGradient(baseHsl, maxLevel), [baseHsl, maxLevel]);
  const getLevelCss = useMemo(
    () => (level: number) => {
      const { h, s, l } = getLevelHsl(level);
      return hslToCss(h, s, l);
    },
    [getLevelHsl]
  );
  const getLevelText = useMemo(
    () => (level: number) => {
      const { h, s, l } = getLevelHsl(level);
      return contrastTextForHsl(h, s, l);
    },
    [getLevelHsl]
  );

  // 🔍 PERFORMANCE: Rastrear mudanças de visualização
  useEffect(() => {
    if (!tree) {
      return;
    }

    const renderStart = performance.now();

    // Performance tracking silenced
    void renderStart;
  }, [activeVisualizacao, tree, flat.length, maxLevel]);

  // Função para buscar dados completos do item (para preencher filtros)
  const fetchItemData = async (itemCodigo: string): Promise<ItemSearchResultItem | null> => {
    try {
      console.log('🔍 [Main] Buscando dados completos do item:', itemCodigo);

      // Tentar buscar via API de search (retorna dados mais completos)
      try {
        console.log('🔍 [Main] Tentando buscar via itemSearchService.search...');
        const searchResult = await itemSearchService.search({ itemCodigo });

        console.log('📊 [Main] Resultado da busca:', {
          total: searchResult.total,
          items: searchResult.items?.length || 0,
          primeiroItem: searchResult.items?.[0],
        });

        if (searchResult.items && searchResult.items.length > 0) {
          const itemData = searchResult.items[0];
          console.log('✅ [Main] Dados COMPLETOS encontrados via search:', {
            codigo: itemData.itemCodigo,
            descricao: itemData.itemDescricao,
            familia: itemData.familiaCodigo,
            familiaDesc: itemData.familiaDescricao,
            grupoEstoque: itemData.grupoEstoqueCodigo,
            grupoEstoqueDesc: itemData.grupoEstoqueDescricao,
            gtin: itemData.gtin,
            tipo: itemData.tipo,
          });
          return itemData;
        } else {
          console.warn('⚠️ [Main] Search retornou 0 resultados');
        }
      } catch (searchError: any) {
        console.error('❌ [Main] Busca via search FALHOU:', {
          erro: searchError.message,
          stack: searchError.stack,
        });
      }

      // Fallback: usar informações gerais (tem menos dados mas funciona para componentes)
      const infoGerais = await itemInformacoesGeraisService.getByCode(itemCodigo);

      if (infoGerais) {
        console.log('📋 [Main] Dados brutos da API informações gerais:', infoGerais);

        // Buscar descrições nos combos já carregados
        const familiaDesc =
          familias.find((f) => f.value === infoGerais.familiaCodigo)?.label || '';
        const familiaComercialDesc =
          familiasComerciais.find((f) => f.value === infoGerais.familiaComercialCodigo)?.label ||
          '';
        const grupoEstoqueDesc =
          gruposDeEstoque.find((g) => g.value === infoGerais.grupoEstoqueCodigo)?.label || '';

        console.log('🔎 [Main] Descrições encontradas nos combos:', {
          familiaCodigo: infoGerais.familiaCodigo,
          familiaDesc,
          familiaComercialCodigo: infoGerais.familiaComercialCodigo,
          familiaComercialDesc,
          grupoEstoqueCodigo: infoGerais.grupoEstoqueCodigo,
          grupoEstoqueDesc,
        });

        const itemData: ItemSearchResultItem = {
          itemCodigo: infoGerais.itemCodigo || itemCodigo,
          itemDescricao: infoGerais.itemDescricao || '',
          unidadeMedidaCodigo: infoGerais.unidadeMedidaCodigo || '',
          unidadeMedidaDescricao: infoGerais.unidadeMedidaDescricao || '',
          familiaCodigo: infoGerais.familiaCodigo || '',
          familiaDescricao: familiaDesc,
          familiaComercialCodigo: infoGerais.familiaComercialCodigo || '',
          familiaComercialDescricao: familiaComercialDesc,
          grupoEstoqueCodigo: infoGerais.grupoEstoqueCodigo || '',
          grupoEstoqueDescricao: grupoEstoqueDesc,
          codObsoleto: 0,
          gtin: '', // ItemInformacoesGeraisFlat não retorna GTIN
        };

        console.log('✅ [Main] Dados COMPLETOS montados com combos:', itemData);
        return itemData;
      }

      console.warn('⚠️ [Main] Item não encontrado');
      return null;
    } catch (error) {
      console.error('❌ [Main] Erro ao buscar dados do item:', error);
      return null;
    }
  };

  // Função para fazer pré-fetch das abas de Dados Mestres
  const prefetchDadosMestres = async (itemCodigo: string) => {
    try {
      // Carregar todas as APIs em paralelo
      const results = await Promise.allSettled([
        itemInformacoesGeraisService.getByCode(itemCodigo),
        dimensoesService.getByCode(itemCodigo),
        planejamentoService.getByCode(itemCodigo),
        manufaturaService.getByCode(itemCodigo),
        fiscalService.getByCode(itemCodigo),
      ]);

      const [infoGerais, dimensoes, planejamento, manufatura, fiscal] = results;

      // Processar resultados
      const newData = {
        informacoesGerais: infoGerais.status === 'fulfilled' ? infoGerais.value : null,
        dimensoes: dimensoes.status === 'fulfilled' ? dimensoes.value : null,
        planejamento: planejamento.status === 'fulfilled' ? planejamento.value : null,
        manufatura: manufatura.status === 'fulfilled' ? manufatura.value : null,
        fiscal: fiscal.status === 'fulfilled' ? fiscal.value : null,
      };

      // Armazenar no cache
      setBulkCachedData(itemCodigo, newData);
    } catch (error) {
      console.error('❌ [Pré-fetch] Erro ao pré-carregar Dados Mestres:', error);
    }
  };

  // Função de drill-down: navegar para um item da estrutura
  const handleItemDrillDown = async (itemCodigo: string, itemDescricao?: string) => {
    console.log('🎯 [Main] handleItemDrillDown CHAMADO:', {
      itemCodigo,
      itemDescricao,
      breadcrumb: breadcrumb.map((b) => b.codigo),
    });

    // Feedback IMEDIATO ao usuário
    const loadingMsg = message.loading({
      content: `🔍 Navegando para: ${itemCodigo}${itemDescricao ? ` - ${itemDescricao}` : ''}`,
      duration: 0,
    });

    setIsDrillDownLoading(true);

    try {
      console.log('📌 [Main] Adicionando ao breadcrumb...');
      // 1. Adicionar ao breadcrumb
      onBreadcrumbChange([...breadcrumb, { codigo: itemCodigo, descricao: itemDescricao }]);

      // 2. ✅ ATUALIZAR URL E FILTROS
      console.log('🌐 [Main] Atualizando URL via navigateToItem...');
      if (navigateToItem) {
        navigateToItem(itemCodigo, activeTabKey);
      }

      // 3. ✅ BUSCAR DADOS COMPLETOS E ATUALIZAR FILTROS
      console.log('📝 [Main] Buscando dados completos para atualizar filtros...');
      const itemData = await fetchItemData(itemCodigo);

      if (itemData) {
        console.log('✅ [Main] Atualizando filtros com dados completos');
        onRowClick(itemData);
      } else {
        // Fallback: usar dados mínimos se a busca falhar
        console.warn('⚠️ [Main] Usando dados mínimos (fallback)');
        const minimalRecord: ItemSearchResultItem = {
          itemCodigo,
          itemDescricao: itemDescricao || '',
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
        onRowClick(minimalRecord);
      }
      console.log('✅ [Main] Navegação iniciada');

      // 3. Fazer pré-fetch de Dados Mestres em background
      prefetchDadosMestres(itemCodigo);

      // Destruir mensagem de loading
      loadingMsg();

      // Mensagem de sucesso CLARA
      message.success({
        content: `✅ Agora analisando: ${itemCodigo}${itemDescricao ? ` - ${itemDescricao}` : ''}`,
        duration: 3,
      });
    } catch (error: any) {
      // Destruir loading
      loadingMsg();

      console.error('❌ [Drill-Down] Erro ao navegar:', error);
      message.error({
        content: `❌ Erro ao navegar: ${error.message}`,
        duration: 5,
      });
    } finally {
      // Loading será removido quando a estrutura terminar de carregar
      setTimeout(() => setIsDrillDownLoading(false), 500);
    }
  };

  // Função para navegar via breadcrumb
  const handleBreadcrumbNavigate = async (codigo: string, index: number) => {
    console.log('🍞 [Main] handleBreadcrumbNavigate CHAMADO:', {
      codigo,
      index,
      breadcrumbAtual: breadcrumb.map((b) => b.codigo),
    });

    setIsDrillDownLoading(true);

    try {
      // 1. Truncar breadcrumb até o índice clicado
      console.log('✂️ [Main] Truncando breadcrumb...');
      onBreadcrumbChange(breadcrumb.slice(0, index + 1));

      // 2. ✅ ATUALIZAR URL
      console.log('🌐 [Main] Atualizando URL via navigateToItem...');
      if (navigateToItem) {
        navigateToItem(codigo, activeTabKey);
      }

      // 3. ✅ BUSCAR DADOS COMPLETOS E ATUALIZAR FILTROS
      console.log('📝 [Main] Buscando dados completos para atualizar filtros...');
      const itemData = await fetchItemData(codigo);

      if (itemData) {
        console.log('✅ [Main] Atualizando filtros com dados completos');
        onRowClick(itemData);
      } else {
        // Fallback: usar dados mínimos se a busca falhar
        console.warn('⚠️ [Main] Usando dados mínimos (fallback)');
        const breadcrumbItem = breadcrumb[index];
        const minimalRecord: ItemSearchResultItem = {
          itemCodigo: codigo,
          itemDescricao: breadcrumbItem.descricao || '',
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
        onRowClick(minimalRecord);
      }

      // 3. Fazer pré-fetch de Dados Mestres em background
      prefetchDadosMestres(codigo);

      message.success(`✅ Navegando para item ${codigo}`);
    } catch (error: any) {
      console.error('❌ [Breadcrumb] Erro ao navegar:', error);
      message.error(`Erro ao navegar: ${error.message}`);
    } finally {
      setTimeout(() => setIsDrillDownLoading(false), 500);
    }
  };

  // Inicializar breadcrumb com item pesquisado quando estrutura é carregada
  // ✅ Reseta breadcrumb quando troca de item raiz (ex: via dock ou nova busca)
  useEffect(() => {
    if (!estruturaData) {
      return;
    }

    // Verificar se estruturaData.codigo já existe em algum lugar do breadcrumb
    const isItemInBreadcrumb = breadcrumb.some((item) => item.codigo === estruturaData.codigo);

    // Só reseta se:
    // 1. Breadcrumb vazio (primeira carga) OU
    // 2. O item carregado NÃO está no breadcrumb (novo root via dock/busca)
    if (breadcrumb.length === 0 || !isItemInBreadcrumb) {
      const itemInicial: BreadcrumbItem = {
        codigo: estruturaData.codigo,
        descricao: estruturaData.descricao,
      };
      onBreadcrumbChange([itemInicial]);
    }
  }, [estruturaData, breadcrumb, onBreadcrumbChange]);

  // Carregar dados quando item é selecionado
  // ✅ COM CACHE E SINCRONIZAÇÃO: Verifica cache antes de fazer fetch
  useEffect(() => {
    const loadEstrutura = async () => {
      console.log('🔄 [Main] useEffect loadEstrutura disparado, selectedRowKey:', selectedRowKey);

      const MODULE_ID = 'engenharia';

      // ✅ REGISTRAR QUE ESTE MÓDULO ESTÁ CARREGANDO
      registerLoading(MODULE_ID);

      // SEMPRE limpar dados primeiro (seja null ou mudança de item)
      setEstruturaData(null);
      setSelectedId(null);

      if (!selectedRowKey) {
        console.log('⚠️ [Main] selectedRowKey é null, não vai carregar estrutura');
        // Se não há item selecionado, apenas limpar e retornar
        unregisterLoading(MODULE_ID);
        return;
      }

      console.log('✅ [Main] selectedRowKey válido, vai carregar estrutura:', selectedRowKey);

      // 🔍 PERFORMANCE: Iniciar tracking
      const perfStart = performance.now();

      // ✅ VERIFICAR CACHE PRIMEIRO
      const cachedEstrutura = getCachedData(selectedRowKey, 'estrutura');
      if (cachedEstrutura) {
        const perfEnd = performance.now();
        const duration = perfEnd - perfStart;
        void duration; // Performance tracking silenced
        setEstruturaData(cachedEstrutura);
        if (cachedEstrutura) {
          setSelectedId(cachedEstrutura.codigo);
        }
        // ✅ DESREGISTRAR LOADING DESTE MÓDULO
        unregisterLoading(MODULE_ID);
        return;
      }

      // ❌ Cache miss - fazer fetch
      setLoadingEstrutura(true);
      try {
        const fetchStart = performance.now();
        const data = await estruturaService.getByCode(selectedRowKey, false, dataReferencia);
        const fetchEnd = performance.now();
        const fetchDuration = fetchEnd - fetchStart;

        setEstruturaData(data);

        // ✅ ARMAZENAR NO CACHE
        setCachedData(selectedRowKey, 'estrutura', data);

        const perfEnd = performance.now();
        const totalDuration = perfEnd - perfStart;
        const totalItens = data?.componentes?.length || 0;

        // Performance tracking silenced
        void fetchDuration;
        void totalDuration;
        void totalItens;

        // Selecionar raiz
        if (data) {
          setSelectedId(data.codigo);
        }
      } catch (error: any) {
        console.error('Erro ao carregar estrutura:', error);
        message.error(`Erro ao carregar estrutura: ${error.message}`);
        setEstruturaData(null);
      } finally {
        setLoadingEstrutura(false);
        // ✅ DESREGISTRAR LOADING DESTE MÓDULO
        unregisterLoading('engenharia');
      }
    };

    loadEstrutura();
  }, [
    selectedRowKey,
    dataReferencia,
    getCachedData,
    setCachedData,
    registerLoading,
    unregisterLoading,
  ]);

  // Carregar dados de Onde Usado quando item é selecionado
  useEffect(() => {
    const loadOndeUsado = async () => {
      // Limpar dados primeiro
      setOndeUsadoData(null);
      setListaFinais(null);

      if (!selectedRowKey) {
        return;
      }

      // Só carregar se a aba de OndeUsado estiver ativa
      if (activeTabKey !== 'ondeUsado') {
        return;
      }

      // Usar cache key diferente para cada modo
      const cacheKey = modoFinaisApenas ? 'ondeUsadoFinais' : 'ondeUsado';

      // Verificar cache primeiro
      const cachedOndeUsado = getCachedData(selectedRowKey, cacheKey);
      if (cachedOndeUsado) {
        if (modoFinaisApenas) {
          setListaFinais(cachedOndeUsado as ItemFinal[]);
          setOndeUsadoData(null);
        } else {
          setOndeUsadoData(cachedOndeUsado as ItemPrincipalOndeUsado);
          setListaFinais(null);
        }
        return;
      }

      // Cache miss - fazer fetch
      setLoadingOndeUsado(true);
      try {
        const data = await ondeUsadoService.getByCode(
          selectedRowKey,
          false,
          dataReferencia,
          modoFinaisApenas
        );

        if (modoFinaisApenas) {
          setListaFinais(data as ItemFinal[]);
          setOndeUsadoData(null);
        } else {
          setOndeUsadoData(data as ItemPrincipalOndeUsado);
          setListaFinais(null);
        }

        // Armazenar no cache
        setCachedData(selectedRowKey, cacheKey, data);
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar onde usado:', error);
        message.error(`Erro ao carregar onde usado: ${error.message}`);
        setOndeUsadoData(null);
        setListaFinais(null);
      } finally {
        setLoadingOndeUsado(false);
      }
    };

    loadOndeUsado();
  }, [
    selectedRowKey,
    dataReferencia,
    activeTabKey,
    modoFinaisApenas,
    getCachedData,
    setCachedData,
  ]);

  // Handlers de exportação
  const handleExportCSV = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToCSV(items, 'resultado_pesquisa');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'estrutura' && estruturaProcessada) {
      exportEstruturaToCSV(estruturaProcessada, 'estrutura_materiais');
      message.success('CSV exportado com sucesso!');
    } else if (activeTabKey === 'ondeUsado' && ondeUsadoProcessado) {
      exportOndeUsadoToCSV(ondeUsadoProcessado, 'onde_usado');
      message.success('CSV exportado com sucesso!');
    } else {
      message.info('Não há dados para exportar');
    }
  };

  const handleExportXLSX = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToXLSX(items, 'resultado_pesquisa');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'estrutura' && estruturaProcessada) {
      exportEstruturaToXLSX(estruturaProcessada, 'estrutura_materiais');
      message.success('Excel exportado com sucesso!');
    } else if (activeTabKey === 'ondeUsado' && ondeUsadoProcessado) {
      exportOndeUsadoToXLSX(ondeUsadoProcessado, 'onde_usado');
      message.success('Excel exportado com sucesso!');
    } else {
      message.info('Não há dados para exportar');
    }
  };

  const handleExportPDF = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      exportSearchToPDF(items, 'resultado_pesquisa');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'estrutura' && estruturaProcessada) {
      exportEstruturaToPDF(estruturaProcessada, 'estrutura_materiais');
      message.success('PDF gerado com sucesso!');
    } else if (activeTabKey === 'ondeUsado' && ondeUsadoProcessado) {
      exportOndeUsadoToPDF(ondeUsadoProcessado, 'onde_usado');
      message.success('PDF gerado com sucesso!');
    } else {
      message.info('Não há dados para exportar');
    }
  };

  const handlePrint = () => {
    if (activeTabKey === 'resultado' && items.length > 0) {
      printSearch(items);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'estrutura' && estruturaProcessada) {
      printEstrutura(estruturaProcessada);
      message.success('Abrindo janela de impressão...');
    } else if (activeTabKey === 'ondeUsado' && ondeUsadoProcessado) {
      printOndeUsado(ondeUsadoProcessado);
      message.success('Abrindo janela de impressão...');
    } else {
      message.info('Não há dados para imprimir');
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
      key: 'estrutura',
      label: (
        <span className="tab-with-shortcut">
          Produtos
          {loadingEstrutura && <span className="tab-loading-dot"></span>}
          <span className="tab-shortcut-hint">Alt+2</span>
        </span>
      ),
      children: (
        <div
          style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
        >
          {/* Loading overlay durante drill-down */}
          {isDrillDownLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <Spin size="large" tip="Carregando estrutura..." />
            </div>
          )}

          <Layout
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              background: 'transparent',
            }}
          >
            {/* Menu Lateral de Visualizações */}
            {menuSecundarioVisible && (
              <Sider
                width={220}
                style={{
                  background: theme === 'dark' ? '#141414' : '#fff',
                  borderRight: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
                }}
              >
                <MenuLateralEstrutura
                  selectedKey={activeVisualizacao}
                  onSelect={onVisualizacaoChange}
                  theme={theme}
                />
              </Sider>
            )}

            {/* Área de visualização */}
            <Content
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
                flex: 1,
                padding: 16,
                background: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
              }}
            >
              {/* Renderizar lista sumarizada ou visualizações normais */}
              {tipoEstrutura === 'consumo' && modoApresentacao === 'lista' ? (
                <ListaSumarizada dados={listaSumarizada} />
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 8,
                    background: theme === 'dark' ? '#141414' : '#ffffff',
                    boxShadow:
                      theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
                    border: `1px solid ${theme === 'dark' ? '#303030' : '#d9d9d9'}`,
                    overflow: 'hidden',
                    minHeight: 0,
                  }}
                >
                  {/* ControlPanel - Dentro do rounded box */}
                  {itemHeaderVisible && breadcrumb.length > 0 && (
                    <ControlPanel
                      breadcrumb={breadcrumb}
                      onBreadcrumbNavigate={handleBreadcrumbNavigate}
                      tipoEstrutura={tipoEstrutura}
                      onTipoEstruturaChange={setTipoEstrutura}
                      quantidadeMultiplicador={quantidadeMultiplicador}
                      onQuantidadeMultiplicadorChange={setQuantidadeMultiplicador}
                      modoApresentacao={modoApresentacao}
                      onModoApresentacaoChange={setModoApresentacao}
                      dataReferencia={dataReferencia}
                      onDataReferenciaChange={setDataReferencia}
                      mostrarHistorico={mostrarHistorico}
                      onMostrarHistoricoChange={setMostrarHistorico}
                      showQty={showQty}
                      onShowQtyChange={setShowQty}
                      baseHex={baseHex}
                      onBaseHexChange={setBaseHex}
                      bgColor={bgColor}
                      onBgColorChange={setBgColor}
                      maxLevel={maxLevelExcludingRoot}
                      currentLevel={maxExpandLevel}
                      onLevelChange={setMaxExpandLevel}
                      theme={theme}
                      isLoading={isItemChanging}
                    />
                  )}
                  <VisualizationContent
                    activeVisualizacao={activeVisualizacao as any}
                    loadingEstrutura={loadingEstrutura}
                    tree={estruturaProcessada}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onItemDrillDown={handleItemDrillDown}
                    getLevelHsl={getLevelHsl}
                    getLevelCss={getLevelCss}
                    getLevelText={getLevelText}
                    showQty={showQty}
                    onShowQtyChange={setShowQty}
                    baseHex={baseHex}
                    onBaseHexChange={setBaseHex}
                    bgColor={bgColor}
                    onBgColorChange={setBgColor}
                    maxExpandLevel={maxExpandLevel}
                    onMaxExpandLevelChange={setMaxExpandLevel}
                    theme={theme}
                  />
                </div>
              )}
            </Content>
          </Layout>
        </div>
      ),
    },
    {
      key: 'ondeUsado',
      label: (
        <span className="tab-with-shortcut">
          Onde Usado
          {loadingOndeUsado && <span className="tab-loading-dot"></span>}
          <span className="tab-shortcut-hint">Alt+3</span>
        </span>
      ),
      children: (
        <div
          style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
        >
          {/* Loading overlay durante drill-down */}
          {isDrillDownLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <Spin size="large" tip="Carregando onde usado..." />
            </div>
          )}

          {/* Toggle Switch para Modo Finais */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
              background: theme === 'dark' ? '#141414' : '#fafafa',
            }}
          >
            <Space align="center">
              <Typography.Text style={{ fontWeight: 500 }}>Onde Usado</Typography.Text>
              <Switch
                checked={modoFinaisApenas}
                onChange={(checked) => {
                  setModoFinaisApenas(checked);
                  // Limpar dados ao trocar modo
                  setOndeUsadoData(null);
                  setListaFinais(null);
                }}
              />
              <Typography.Text style={{ fontWeight: 500 }}>Finais Onde Usado</Typography.Text>
            </Space>
          </div>

          <Layout
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              background: 'transparent',
            }}
          >
            {/* Menu Lateral de Visualizações - Só mostrar em modo estrutura completa */}
            {!modoFinaisApenas && menuSecundarioVisible && (
              <Sider
                width={220}
                style={{
                  background: theme === 'dark' ? '#141414' : '#fff',
                  borderRight: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
                }}
              >
                <MenuLateralEstrutura
                  selectedKey={activeVisualizacao}
                  onSelect={onVisualizacaoChange}
                  theme={theme}
                />
              </Sider>
            )}

            {/* Área de visualização */}
            <Content
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
                flex: 1,
                padding: 16,
                background: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
              }}
            >
              {/* Renderizar baseado no modo */}
              {modoFinaisApenas && listaFinais ? (
                // Modo Finais Apenas - Lista Simples
                <ListaFinais listaFinais={listaFinais} loading={loadingOndeUsado} />
              ) : tipoEstrutura === 'consumo' && modoApresentacao === 'lista' ? (
                // Modo Consumo - Lista Sumarizada
                <ListaSumarizada dados={listaSumarizadaOndeUsado} />
              ) : (
                // Modo Normal - Visualização Completa
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 8,
                    background: theme === 'dark' ? '#141414' : '#ffffff',
                    boxShadow:
                      theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
                    border: `1px solid ${theme === 'dark' ? '#303030' : '#d9d9d9'}`,
                    overflow: 'hidden',
                    minHeight: 0,
                  }}
                >
                  {/* ControlPanel - Dentro do rounded box */}
                  {itemHeaderVisible && breadcrumb.length > 0 && (
                    <ControlPanel
                      breadcrumb={breadcrumb}
                      onBreadcrumbNavigate={handleBreadcrumbNavigate}
                      tipoEstrutura={tipoEstrutura}
                      onTipoEstruturaChange={setTipoEstrutura}
                      quantidadeMultiplicador={quantidadeMultiplicador}
                      onQuantidadeMultiplicadorChange={setQuantidadeMultiplicador}
                      modoApresentacao={modoApresentacao}
                      onModoApresentacaoChange={setModoApresentacao}
                      dataReferencia={dataReferencia}
                      onDataReferenciaChange={setDataReferencia}
                      mostrarHistorico={mostrarHistorico}
                      onMostrarHistoricoChange={setMostrarHistorico}
                      showQty={showQty}
                      onShowQtyChange={setShowQty}
                      baseHex={baseHex}
                      onBaseHexChange={setBaseHex}
                      bgColor={bgColor}
                      onBgColorChange={setBgColor}
                      maxLevel={maxLevelExcludingRoot}
                      currentLevel={maxExpandLevel}
                      onLevelChange={setMaxExpandLevel}
                      theme={theme}
                      isLoading={isItemChanging}
                    />
                  )}
                  <VisualizationContent
                    activeVisualizacao={activeVisualizacao as any}
                    loadingEstrutura={loadingOndeUsado}
                    tree={ondeUsadoProcessado as any}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onItemDrillDown={handleItemDrillDown}
                    getLevelHsl={getLevelHsl}
                    getLevelCss={getLevelCss}
                    getLevelText={getLevelText}
                    showQty={showQty}
                    onShowQtyChange={setShowQty}
                    baseHex={baseHex}
                    onBaseHexChange={setBaseHex}
                    bgColor={bgColor}
                    onBgColorChange={setBgColor}
                    maxExpandLevel={maxExpandLevel}
                    onMaxExpandLevelChange={setMaxExpandLevel}
                    theme={theme}
                    isOndeUsado={true}
                  />
                </div>
              )}
            </Content>
          </Layout>
        </div>
      ),
    },
  ];

  return (
    <>
      <style>{`
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

        /* Força o Tabs a ocupar 100% da altura */
        .ant-tabs-content-holder {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .ant-tabs-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
        }

        .ant-tabs-tabpane {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
        }
      `}</style>
      <div
        style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={onTabChange}
          items={tabItems}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
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

export default EngenhariaMain;
