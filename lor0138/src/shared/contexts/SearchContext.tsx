import React, { createContext, useContext, ReactNode } from 'react';
import { useSearchFilters } from '../hooks/useSearchFilters';

type SearchContextType = ReturnType<typeof useSearchFilters>;

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

/**
 * Provider de estado de busca
 * Centraliza lógica de filtros e resultados de busca
 */
export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const searchState = useSearchFilters();

  return <SearchContext.Provider value={searchState}>{children}</SearchContext.Provider>;
};

/**
 * Hook para acessar o contexto de busca
 */
export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext deve ser usado dentro de um SearchProvider');
  }
  return context;
};
