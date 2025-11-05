// src/deposito/listar/types.ts

/**
 * Types específicos do módulo Deposito - Listar
 */

import { ApiResponse } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Item da lista de depósitos
 */
export interface DepositoListItem {
  codigo: string;
  nome: string;
  consideraSaldoDisponivel: string;
  consideraSaldoAlocado: string;
  permissaoMovDeposito1: string;
  permissaoMovDeposito2: string;
  permissaoMovDeposito3: string;
  produtoAcabado: string;
  tipoDeposito: string;
  depositoProcesso: string;
  nomeAbrev: string;
  saldoDisponivel: string;
  depositoCQ: string;
  depositoRejeito: string;
  char1: string;
  char2: string;
  dec1: number;
  dec2: number;
  int1: number;
  int2: number;
  log1: boolean;
  log2: boolean;
  data1: Date | null;
  data2: Date | null;
  checkSum: string;
  depositoReciclado: string;
  consideraOrdens: string;
  depositoWMS: string;
  alocaSaldoERP: string;
  origemExterna: string;
  depositoWmsExterno: string;
  alocaSaldoWmsExterno: string;
}

/**
 * Resposta da listagem de depósitos
 */
export interface DepositoListarResponse {
  depositos: DepositoListItem[];
  total: number;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type DepositoListarResponseDTO = ApiResponse<DepositoListItem[]>;
