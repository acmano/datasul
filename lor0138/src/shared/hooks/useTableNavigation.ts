import React, { useCallback } from 'react';
import { ItemSearchResultItem } from '../../modules/item/search/types/search.types';

interface UseTableNavigationProps {
  searchResults: ItemSearchResultItem[];
  selectedRowKey: string | null;
  activeTabKey: string;
  onRowClick: (record: ItemSearchResultItem) => void;
  onEnterKey?: () => void; // Callback para quando Enter for pressionado
}

/**
 * Hook customizado para navegação por teclado na tabela
 */
export const useTableNavigation = ({
  searchResults,
  selectedRowKey,
  activeTabKey,
  onRowClick,
  onEnterKey,
}: UseTableNavigationProps) => {
  /**
   * Manipula teclas de navegação na tabela
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (activeTabKey !== 'resultado' || searchResults.length === 0) {
        return;
      }

      const currentIndex = searchResults.findIndex((item) => item.itemCodigo === selectedRowKey);

      const linesPerPage = 12;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < searchResults.length - 1) {
            onRowClick(searchResults[currentIndex + 1]);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            onRowClick(searchResults[currentIndex - 1]);
          }
          break;

        case 'Home':
          e.preventDefault();
          if (searchResults.length > 0) {
            onRowClick(searchResults[0]);
          }
          break;

        case 'End':
          e.preventDefault();
          if (searchResults.length > 0) {
            onRowClick(searchResults[searchResults.length - 1]);
          }
          break;

        case 'PageDown':
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + linesPerPage, searchResults.length - 1);
          if (nextIndex !== currentIndex) {
            onRowClick(searchResults[nextIndex]);
          }
          break;

        case 'PageUp':
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - linesPerPage, 0);
          if (prevIndex !== currentIndex) {
            onRowClick(searchResults[prevIndex]);
          }
          break;

        case 'Enter':
          e.preventDefault();
          // Chamar callback se fornecido (para navegar para aba Base)
          if (onEnterKey) {
            onEnterKey();
          }
          break;
      }
    },
    [activeTabKey, searchResults, selectedRowKey, onRowClick, onEnterKey]
  );

  return { handleKeyDown };
};
