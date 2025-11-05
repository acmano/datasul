// src/shared/hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onMenuShortcut?: (menuKey: string) => void;
  onTabShortcut?: (tabIndex: number) => void;
  onSubmenuShortcut?: (submenuIndex: number) => void;
  onVisualizacaoShortcut?: (vizIndex: number) => void; // NOVO: Atalhos Ctrl+Alt+# para visualizações
  onToggleMenu?: () => void;
  onToggleMainMenu?: () => void; // NOVO: Toggle do menu principal
  onToggleSearchForm?: () => void; // NOVO: Toggle do formulário de pesquisa
  onToggleItemHeader?: () => void; // NOVO: Toggle do header do item
  onF1Help?: () => void; // NOVO: Abre ajuda contextual
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onMenuShortcut,
  onTabShortcut,
  onSubmenuShortcut,
  onVisualizacaoShortcut, // NOVO
  onToggleMenu,
  onToggleMainMenu, // NOVO
  onToggleSearchForm, // NOVO
  onToggleItemHeader, // NOVO
  onF1Help, // NOVO
  enabled = true,
}: KeyboardShortcutsConfig) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 para ajuda contextual
      if (e.key === 'F1' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onF1Help?.();
        return;
      }

      // Ctrl+0 para toggle do menu principal
      if (e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'Digit0') {
        e.preventDefault();
        onToggleMainMenu?.();
        return;
      }

      // Ctrl+Shift+P para toggle do formulário de pesquisa
      if (e.ctrlKey && e.shiftKey && !e.altKey && e.key === 'P') {
        e.preventDefault();
        onToggleSearchForm?.();
        return;
      }

      // Ctrl+Shift+H para toggle do header do item
      if (e.ctrlKey && e.shiftKey && !e.altKey && e.key === 'H') {
        e.preventDefault();
        onToggleItemHeader?.();
        return;
      }

      // Ctrl+1-9 para menu lateral
      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''));
          if (num >= 1 && num <= 9) {
            e.preventDefault();
            onMenuShortcut?.(num.toString());
          }
        }
      }

      // Alt+1-9 para abas
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''));
          if (num >= 1 && num <= 9) {
            e.preventDefault();
            onTabShortcut?.(num);
          }
        }
      }

      // Ctrl+Alt+0 para toggle do menu lateral de seções
      // Ctrl+Alt+1-9 para submenus/visualizações
      if (e.ctrlKey && e.altKey && !e.shiftKey) {
        // Verifica PRIMEIRO se é Digit0 (toggle menu)
        if (e.code === 'Digit0') {
          e.preventDefault();
          onToggleMenu?.();
        }
        // DEPOIS verifica se é Digit1-9 (submenus/visualizações)
        else if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''));
          if (num >= 1 && num <= 9) {
            e.preventDefault();
            // Chama ambos os callbacks (para compatibilidade)
            onSubmenuShortcut?.(num);
            onVisualizacaoShortcut?.(num);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onMenuShortcut,
    onTabShortcut,
    onSubmenuShortcut,
    onVisualizacaoShortcut,
    onToggleMenu,
    onToggleMainMenu,
    onToggleSearchForm,
    onToggleItemHeader,
    onF1Help,
  ]);
};
