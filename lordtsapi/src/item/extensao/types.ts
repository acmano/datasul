// src/item/extensao/types.ts

/**
 * Types específicos do módulo Item - Extensão
 */

import { ApiResponse } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Dados de extensão do item (dimensões, pesos, embalagens)
 *
 * Campos organizados por categoria:
 * - Peça: Dimensões e peso da peça individual
 * - Embalagem Item: Dimensões e peso da embalagem do item
 * - IVV: Dados de volume/variante
 * - Embalagem Produto: Dimensões e peso da embalagem do produto
 * - Códigos de Barras: EAN e DUN
 * - SKU: Dimensões e peso do SKU
 * - Quantidades: Organização e empacotamento
 */
export interface ItemExtensao {
  // Identificação
  itemcod: string;

  // Dimensões da Peça
  pecaaltura: number;
  pecalargura: number;
  pecaprof: number;
  pecapeso: number;

  // Embalagem do Item
  itembalt: number;
  itemblarg: number;
  itembprof: number;
  itembpeso: number;

  // Dados IVV (Item Volume/Variante)
  itemvalt: number;
  itemvlarg: number;
  itemvprof: number;
  itemvpeso: number;
  pecasitem: number;

  // Embalagem do Produto
  prodebalt: number;
  prodeblarg: number;
  prodebprof: number;
  prodebpeso: number;

  // Códigos de Barras
  prodgtin13: string; // EAN (GTIN-13)
  caixagtin14: string; // DUN (GTIN-14)

  // Dimensões SKU
  prodvalt: number;
  prodvlarg: number;
  prodvprof: number;
  prodvpeso: number;

  // Quantidades e Organização
  itensprod: number; // Quantidade de itens por produto
  prodscaixa: number; // Quantidade de produtos por caixa
  lastro: number; // Produtos por camada
  camada: number; // Número de camadas
  embcod: string; // Código da embalagem
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type ItemExtensaoResponseDTO = ApiResponse<ItemExtensao>;
