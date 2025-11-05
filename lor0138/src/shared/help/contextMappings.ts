/**
 * Mapeamento de Contexto para Tópicos de Ajuda
 * Determina qual tópico exibir baseado no contexto atual
 */

import type { ContextMapping, HelpContext } from '../types/help.types';

/**
 * Mapeamento de contexto para tópico de ajuda
 * Determina qual tópico exibir baseado no contexto atual
 */
export const contextMappings: ContextMapping[] = [
  // Menu principal - Dados Mestres
  { menuKey: '1', topicKey: 'dados-mestres' },

  // Tabs do módulo Dados Mestres
  { menuKey: '1', tabKey: 'resultado', topicKey: 'tab-resultado' },
  { menuKey: '1', tabKey: 'base', topicKey: 'tab-base' },
  { menuKey: '1', tabKey: 'dimensoes', topicKey: 'tab-dimensoes' },
  { menuKey: '1', tabKey: 'suprimentos', topicKey: 'tab-suprimentos' },

  // Menu principal - Engenharia
  { menuKey: '2', topicKey: 'engenharia' },

  // Tabs do módulo Engenharia
  { menuKey: '2', tabKey: 'resultado', topicKey: 'tab-resultado-engenharia' },
  { menuKey: '2', tabKey: 'estrutura', topicKey: 'tab-estrutura' },

  // Menu principal - PCP
  { menuKey: '3', topicKey: 'pcp' },

  // Tabs do módulo PCP
  { menuKey: '3', tabKey: 'resultado', topicKey: 'tab-resultado-pcp' },
  { menuKey: '3', tabKey: 'base', topicKey: 'tab-base-pcp' },

  // Menu principal - Manufatura
  { menuKey: '4', topicKey: 'manufatura' },

  // Tabs do módulo Manufatura
  { menuKey: '4', tabKey: 'resultado', topicKey: 'tab-resultado-manufatura' },
  { menuKey: '4', tabKey: 'base', topicKey: 'tab-base-manufatura' },

  // Menu principal - Suprimentos (placeholder)
  { menuKey: '5', topicKey: 'sobre' },

  // Menu principal - Fiscal
  { menuKey: '6', topicKey: 'fiscal' },

  // Tabs do módulo Fiscal
  { menuKey: '6', tabKey: 'resultado', topicKey: 'tab-resultado-fiscal' },
  { menuKey: '6', tabKey: 'base', topicKey: 'tab-base-fiscal' },
];

/**
 * Encontra o tópico de ajuda correspondente ao contexto atual
 * @param context Contexto atual do usuário
 * @returns Chave do tópico de ajuda ou 'sobre' como padrão
 */
export function getTopicKeyByContext(context: HelpContext): string {
  // Busca mapeamento mais específico primeiro (com tabKey)
  if (context.tabKey) {
    const mapping = contextMappings.find(
      (m) => m.menuKey === context.menuKey && m.tabKey === context.tabKey
    );
    if (mapping) {
      return mapping.topicKey;
    }
  }

  // Busca mapeamento por menu apenas
  const mapping = contextMappings.find((m) => m.menuKey === context.menuKey && !m.tabKey);
  if (mapping) {
    return mapping.topicKey;
  }

  // Padrão: tópico "sobre"
  return 'sobre';
}

/**
 * Achatador recursivo do índice para busca linear
 * @param items Itens do índice
 * @returns Array com todos os itens (incluindo filhos)
 */
export function flattenHelpIndex(items: any[]): any[] {
  const result: any[] = [];

  items.forEach((item) => {
    result.push(item);
    if (item.children) {
      result.push(...flattenHelpIndex(item.children));
    }
  });

  return result;
}
