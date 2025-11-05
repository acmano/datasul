/**
 * useHelpContext Hook
 * Detecta o contexto atual do usuário para ajuda contextual
 */

import { useState, useEffect } from 'react';
import type { HelpContext } from '../types/help.types';

interface UseHelpContextProps {
  menuKey: string;
  activeTabKey?: string;
}

/**
 * Hook para gerenciar o contexto atual da ajuda
 * Monitora menu e aba ativos para determinar o tópico de ajuda apropriado
 */
export function useHelpContext({ menuKey, activeTabKey }: UseHelpContextProps): HelpContext {
  const [context, setContext] = useState<HelpContext>({
    menuKey,
    tabKey: activeTabKey,
  });

  useEffect(() => {
    setContext({
      menuKey,
      tabKey: activeTabKey,
    });
  }, [menuKey, activeTabKey]);

  return context;
}

export default useHelpContext;
