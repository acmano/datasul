// src/deposito/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Deposito - Informações Gerais
 */

import { ApiResponse } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// DATABASE QUERY RESULT
// ============================================================================

/**
 * Resultado da query master de depósito
 * Nota: As transformações agora são feitas no SQL, então os valores já vêm formatados
 */
export interface DepositoMasterQueryResult {
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

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Informações gerais de um depósito
 */
export interface DepositoInformacoesGerais {
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

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO de entrada
 */
export interface DepositoInformacoesGeraisRequestDTO {
  depositoCodigo: string;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type DepositoInformacoesGeraisResponseDTO = ApiResponse<DepositoInformacoesGerais>;
