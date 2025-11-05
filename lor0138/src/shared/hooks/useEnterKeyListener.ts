import { useEffect, useRef } from 'react';

interface UseEnterKeyListenerProps {
  onEnter: () => void;
  loading: boolean;
}

/**
 * Hook customizado para listener global da tecla Enter
 * Aciona busca quando Enter é pressionado, exceto em selects e textareas
 */
export const useEnterKeyListener = ({ onEnter, loading }: UseEnterKeyListenerProps) => {
  // Usar ref para manter referência estável do callback
  const onEnterRef = useRef(onEnter);

  // Atualizar a ref quando onEnter mudar
  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
      // APENAS capturar Enter, nada mais
      if (e.key !== 'Enter') {
        return;
      }

      const target = e.target as HTMLElement;
      const isInSelect = target.closest('.ant-select-dropdown');
      const isTextarea = target.tagName === 'TEXTAREA';

      // ✅ FIX: NÃO disparar se estamos na tabela de resultados
      // Verifica se o elemento ou algum ancestral tem o atributo data-results-table
      const isInResultsTable = target.closest('[data-results-table="true"]');

      if (!isInSelect && !isTextarea && !isInResultsTable && !loading) {
        e.preventDefault();
        onEnterRef.current();
      }
    };

    window.addEventListener('keydown', handleGlobalEnter);
    return () => window.removeEventListener('keydown', handleGlobalEnter);
  }, [loading]); // Removido onEnter das dependências
};
