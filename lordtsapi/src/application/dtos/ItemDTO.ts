// src/application/dtos/ItemDTO.ts

/**
 * Data Transfer Object - Item
 *
 * Objeto simples para transferência de dados de Item.
 * Não contém lógica de negócio.
 *
 * @example
 * const itemDTO: ItemDTO = {
 *   codigo: '7530110',
 *   descricao: 'TORNEIRA MONOCOMANDO',
 *   unidade: 'UN',
 *   ativo: true
 * };
 */
export interface ItemDTO {
  codigo: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  observacao?: string | undefined;
}

/**
 * DTO para criação de Item
 */
export interface CreateItemDTO {
  codigo: string;
  descricao: string;
  unidade: string;
  ativo?: boolean | undefined;
  observacao?: string | undefined;
}

/**
 * DTO para atualização de Item
 */
export interface UpdateItemDTO {
  descricao?: string | undefined;
  unidade?: string | undefined;
  ativo?: boolean | undefined;
  observacao?: string | undefined;
}

/**
 * DTO para resposta de Item com informações completas
 */
export interface ItemDetailDTO extends ItemDTO {
  familia?: {
    codigo: string;
    descricao: string;
  } | undefined;
  familiaComercial?: {
    codigo: string;
    descricao: string;
  } | undefined;
  grupoEstoque?: {
    codigo: string;
    descricao: string;
  } | undefined;
  estabelecimentos?: Array<{
    codigo: string;
    nome: string;
  }> | undefined;
}

/**
 * DTO para listagem de itens (resumido)
 */
export interface ItemListDTO {
  codigo: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
}

/**
 * DTO para busca de itens
 */
export interface SearchItemsDTO {
  query?: string | undefined;
  familiaId?: string | undefined;
  ativo?: boolean | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

/**
 * DTO para resultado de busca
 */
export interface SearchItemsResultDTO {
  items: ItemListDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
