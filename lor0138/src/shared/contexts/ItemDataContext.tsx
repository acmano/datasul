// src/shared/contexts/ItemDataContext.tsx

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Interface para armazenar dados de diferentes tipos
interface ItemCacheData {
  informacoesGerais?: any;
  dimensoes?: any;
  planejamento?: any;
  manufatura?: any;
  fiscal?: any;
  suprimentos?: any;
  estrutura?: any;
  ondeUsado?: any;
  ondeUsadoFinais?: any; // Cache separado para modo "Finais Onde Usado"
}

// Interface do cache completo (chave: itemCodigo)
interface CacheStore {
  [itemCodigo: string]: ItemCacheData;
}

interface ItemDataContextType {
  // Obter dados do cache
  getCachedData: (itemCodigo: string, dataType: keyof ItemCacheData) => any | null;

  // Armazenar dados no cache
  setCachedData: (itemCodigo: string, dataType: keyof ItemCacheData, data: any) => void;

  // Armazenar múltiplos dados de uma vez
  setBulkCachedData: (itemCodigo: string, dataMap: Partial<ItemCacheData>) => void;

  // Verificar se dados existem no cache
  hasCachedData: (itemCodigo: string, dataType: keyof ItemCacheData) => boolean;

  // Limpar cache de um item específico
  clearItemCache: (itemCodigo: string) => void;

  // Limpar todo o cache
  clearAllCache: () => void;

  // Obter item atualmente selecionado
  selectedItemCode: string | null;

  // Definir item atualmente selecionado
  setSelectedItemCode: (code: string | null) => void;

  // ✅ Estado de loading global para sincronização
  isItemChanging: boolean;

  // ✅ Registrar que um módulo começou a carregar
  registerLoading: (moduleId: string) => void;

  // ✅ Registrar que um módulo terminou de carregar
  unregisterLoading: (moduleId: string) => void;
}

const ItemDataContext = createContext<ItemDataContextType | undefined>(undefined);

export const ItemDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<CacheStore>({});
  const [selectedItemCode, setSelectedItemCodeState] = useState<string | null>(null);
  // ✅ Set de módulos que estão carregando
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  // isItemChanging é true se há algum módulo carregando
  const isItemChanging = loadingModules.size > 0;

  const getCachedData = useCallback(
    (itemCodigo: string, dataType: keyof ItemCacheData): any | null => {
      return cache[itemCodigo]?.[dataType] ?? null;
    },
    [cache]
  );

  const setCachedData = useCallback(
    (itemCodigo: string, dataType: keyof ItemCacheData, data: any) => {
      setCache((prev) => ({
        ...prev,
        [itemCodigo]: {
          ...(prev[itemCodigo] || {}),
          [dataType]: data,
        },
      }));
    },
    []
  );

  const setBulkCachedData = useCallback((itemCodigo: string, dataMap: Partial<ItemCacheData>) => {
    setCache((prev) => ({
      ...prev,
      [itemCodigo]: {
        ...(prev[itemCodigo] || {}),
        ...dataMap,
      },
    }));
  }, []);

  const hasCachedData = useCallback(
    (itemCodigo: string, dataType: keyof ItemCacheData): boolean => {
      return cache[itemCodigo]?.[dataType] !== undefined && cache[itemCodigo]?.[dataType] !== null;
    },
    [cache]
  );

  const clearItemCache = useCallback((itemCodigo: string) => {
    setCache((prev) => {
      const newCache = { ...prev };
      delete newCache[itemCodigo];
      return newCache;
    });
  }, []);

  const clearAllCache = useCallback(() => {
    setCache({});
  }, []);

  const setSelectedItemCode = useCallback((code: string | null) => {
    setSelectedItemCodeState(code);
  }, []);

  // ✅ Registrar que um módulo começou a carregar
  const registerLoading = useCallback((moduleId: string) => {
    setLoadingModules((prev) => {
      const newSet = new Set(prev);
      newSet.add(moduleId);
      return newSet;
    });
  }, []);

  // ✅ Registrar que um módulo terminou de carregar
  const unregisterLoading = useCallback((moduleId: string) => {
    setLoadingModules((prev) => {
      const newSet = new Set(prev);
      newSet.delete(moduleId);
      return newSet;
    });
  }, []);

  const value: ItemDataContextType = {
    getCachedData,
    setCachedData,
    setBulkCachedData,
    hasCachedData,
    clearItemCache,
    clearAllCache,
    selectedItemCode,
    setSelectedItemCode,
    isItemChanging,
    registerLoading,
    unregisterLoading,
  };

  return <ItemDataContext.Provider value={value}>{children}</ItemDataContext.Provider>;
};

export const useItemDataCache = (): ItemDataContextType => {
  const context = useContext(ItemDataContext);
  if (!context) {
    throw new Error('useItemDataCache must be used within an ItemDataProvider');
  }
  return context;
};
