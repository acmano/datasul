/**
 * Sistema de Ajuda - Tipos TypeScript
 * Estrutura para ajuda sensível ao contexto
 */

/**
 * Representa o contexto atual do usuário na aplicação
 * Usado para determinar qual tópico de ajuda exibir
 */
export interface HelpContext {
  menuKey: string; // Menu lateral selecionado (ex: '1' = Dados Mestres)
  tabKey?: string; // Aba ativa (ex: 'base', 'dimensoes')
  subSection?: string; // Subseção dentro da aba (se houver)
}

/**
 * Item do índice de ajuda
 * Estrutura hierárquica para navegação
 */
export interface HelpIndexItem {
  key: string; // Identificador único do tópico
  title: string; // Título exibido no índice
  icon?: React.ReactNode; // Ícone opcional
  children?: HelpIndexItem[]; // Sub-itens (hierarquia)
}

/**
 * Conteúdo de um tópico de ajuda
 */
export interface HelpTopicContent {
  key: string; // Chave única do tópico
  title: string; // Título do tópico
  content: React.ReactNode; // Conteúdo HTML/JSX do tópico
  keywords?: string[]; // Palavras-chave para busca (futuro)
}

/**
 * Mapeamento de contexto para tópico de ajuda
 */
export interface ContextMapping {
  menuKey: string;
  tabKey?: string;
  subSection?: string;
  topicKey: string; // Tópico de ajuda correspondente
}

/**
 * Props do componente HelpModal
 */
export interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  initialContext?: HelpContext; // Contexto inicial (para F1)
  initialTopicKey?: string; // Tópico inicial (para menu Ajuda)
}
