// src/shared/validators/paramValidators.ts

import { ValidationError } from '@shared/errors/CustomErrors';

/**
 * Valida parâmetro obrigatório extraído de req.params
 */
export function validateRequiredParam(
  value: string | undefined,
  fieldName: string,
  maxLength: number = 16
): string {
  // Verifica se existe
  if (!value || value.trim() === '') {
    throw new ValidationError(`O ${fieldName} é obrigatório`);
  }

  // Verifica tamanho
  if (value.length > maxLength) {
    throw new ValidationError(
      `O ${fieldName} não pode ter mais de ${maxLength} caracteres`
    );
  }

  return value;
}

/**
 * Valida código de item
 */
export function validateItemCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do item', 16);
}

/**
 * Valida código de estabelecimento
 */
export function validateEstabelecimentoCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do estabelecimento', 16);
}

/**
 * Valida código de família
 */
export function validateFamiliaCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código da família', 16);
}

/**
 * Valida código de família comercial
 */
export function validateFamiliaComercialCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código da família comercial', 16);
}

/**
 * Valida código de grupo de estoque
 */
export function validateGrupoDeEstoqueCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do grupo de estoque', 16);
}