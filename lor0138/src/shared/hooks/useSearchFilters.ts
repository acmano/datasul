import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import {
  ItemSearchFilters,
  ItemSearchResultItem,
} from '../../modules/item/search/types/search.types';
import { itemSearchService } from '../../modules/item/search/services/itemSearch.service';
import { handleError } from '../utils/errorHandler';

/**
 * Parâmetros do hook useSearchFilters
 */
interface UseSearchFiltersParams {
  /**
   * Função para navegar para um item específico com aba
   * @param codigo - Código do item
   * @param aba - Nome da aba (ex: 'base', 'fiscal')
   */
  navigateToItem: (codigo: string, aba: string) => void;

  /**
   * Função para voltar à tela de busca (sem item selecionado)
   */
  navigateToSearch: () => void;

  /**
   * Módulo atual ('1' para Dados Mestres, '2' para Engenharias)
   * Usado para determinar qual aba abrir quando há resultado único
   */
  currentModule?: string;
}

/**
 * Hook customizado para gerenciar filtros e busca de itens
 *
 * @param params - Parâmetros contendo funções de navegação
 * @returns Objeto com estado e handlers de busca
 */
export const useSearchFilters = ({
  navigateToItem,
  navigateToSearch,
  currentModule,
}: UseSearchFiltersParams) => {
  const [filtros, setFiltros] = useState<ItemSearchFilters>({});
  const [searchResults, setSearchResults] = useState<ItemSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  // Flag para prevenir múltiplas requisições simultâneas
  const isSearchingRef = useRef(false);

  // Timestamp da última busca para debounce
  const lastSearchTimeRef = useRef(0);
  const DEBOUNCE_MS = 1000; // 1 segundo de debounce entre buscas

  /**
   * Atualiza filtros de busca
   */
  const handleFilterChange = useCallback((changedValues: Partial<ItemSearchFilters>) => {
    setFiltros((prev) => ({ ...prev, ...changedValues }));
  }, []);

  /**
   * Executa busca de itens
   */
  const handleSearch = useCallback(async () => {
    // Prevenir múltiplas requisições simultâneas
    if (isSearchingRef.current) {
      console.warn('⚠️ Busca já em andamento, ignorando nova requisição');
      return;
    }

    // Debounce: prevenir buscas muito próximas (rate limiting)
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTimeRef.current;
    if (timeSinceLastSearch < DEBOUNCE_MS) {
      console.warn(
        `⚠️ Aguarde ${Math.ceil((DEBOUNCE_MS - timeSinceLastSearch) / 1000)}s antes de fazer nova busca`
      );
      message.warning('Aguarde um momento antes de fazer nova busca');
      return;
    }
    lastSearchTimeRef.current = now;

    if (
      !filtros.itemCodigo &&
      !filtros.itemDescricao &&
      !filtros.familiaCodigo &&
      !filtros.familiaComercialCodigo &&
      !filtros.grupoEstoqueCodigo &&
      !filtros.gtin &&
      (!filtros.tipoItem || filtros.tipoItem.length === 0)
    ) {
      message.warning('Informe ao menos um filtro para pesquisar');
      return;
    }

    try {
      isSearchingRef.current = true;
      setLoading(true);
      const response = await itemSearchService.search(filtros);

      const items = response?.items || [];
      const total = response?.total || 0;

      setSearchResults(items);

      if (items.length > 0) {
        const firstItem = items[0];
        setSelectedRowKey(firstItem.itemCodigo);

        // Update form with selected item data, including tipo
        setFiltros({
          itemCodigo: firstItem.itemCodigo,
          itemDescricao: firstItem.itemDescricao,
          familiaCodigo: firstItem.familiaCodigo,
          familiaComercialCodigo: firstItem.familiaComercialCodigo,
          grupoEstoqueCodigo: firstItem.grupoEstoqueCodigo?.toString(),
          gtin: firstItem.gtin,
          tipoItem: firstItem.tipo ? [firstItem.tipo.trim()] : undefined,
        });

        // ✅ Navegar para aba apropriada baseado no número de resultados e módulo atual
        if (items.length === 1) {
          // 1 item: vai direto para primeira aba de dados (depende do módulo)
          let targetTab = 'base'; // Default para Dados Mestres

          if (currentModule === '2') {
            // Engenharias module: vai para aba 'estrutura' (Produtos)
            targetTab = 'estrutura';
          } else if (currentModule === '1') {
            // Dados Mestres module: vai para aba 'base'
            targetTab = 'base';
          }

          navigateToItem(firstItem.itemCodigo, targetTab);
        } else {
          // Múltiplos itens: volta para tela de busca (Resultado)
          navigateToSearch();
        }
      }

      message.success(`${total} item(ns) encontrado(s)`);
    } catch (error) {
      handleError(error, {
        context: 'useSearchFilters.handleSearch',
        customMessage: 'Erro ao pesquisar itens. Verifique a conexão com a API.',
      });
      setSearchResults([]);
      setSelectedRowKey(null);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  }, [filtros, navigateToItem, navigateToSearch, currentModule]);

  /**
   * Limpa filtros e resultados
   */
  const handleClear = useCallback(() => {
    setFiltros({});
    setSearchResults([]);
    setSelectedRowKey(null);
    // ✅ Navega de volta para tela de busca
    navigateToSearch();
  }, [navigateToSearch]);

  /**
   * Seleciona linha da tabela
   */
  const handleRowClick = useCallback((record: ItemSearchResultItem) => {
    setSelectedRowKey(record.itemCodigo);

    // ⚠️ IMPORTANTE: Ao atualizar filtros com dados do item, NÃO dispara nova busca
    // Apenas atualiza o formulário para refletir o item selecionado
    setFiltros({
      itemCodigo: record.itemCodigo,
      itemDescricao: record.itemDescricao,
      familiaCodigo: record.familiaCodigo,
      familiaComercialCodigo: record.familiaComercialCodigo,
      grupoEstoqueCodigo: record.grupoEstoqueCodigo?.toString(),
      gtin: record.gtin,
      tipoItem: record.tipo ? [record.tipo.trim()] : undefined,
    });
  }, []);

  return {
    filtros,
    searchResults,
    loading,
    selectedRowKey,
    handleFilterChange,
    handleSearch,
    handleClear,
    handleRowClick,
  };
};
