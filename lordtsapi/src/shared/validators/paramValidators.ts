/**
 * Validators de parâmetros de requisição
 *
 * Wrappers sobre validators puros do core que adicionam throw de erros.
 * Integra validação pura com error handling da aplicação.
 *
 * @module shared/validators/paramValidators
 * @since 1.0.0
 */

import { ValidationError } from '@shared/errors/CustomErrors';
import { isValidCode, validateCode } from '@/core';

/**
 * Valida parâmetro obrigatório extraído de req.params
 *
 * Usa validação pura do core + error handling.
 *
 * @param value - Valor do parâmetro
 * @param fieldName - Nome do campo (para mensagem de erro)
 * @param maxLength - Tamanho máximo (padrão: 16)
 * @returns Valor validado e sanitizado
 * @throws {ValidationError} Se validação falhar
 *
 * @example
 * ```typescript
 * const itemCodigo = validateRequiredParam(req.params.codigo, 'código do item', 16);
 * ```
 */
export function validateRequiredParam(
  value: string | undefined,
  fieldName: string,
  maxLength: number = 16
): string {
  // Verifica se existe
  if (!isValidCode(value)) {
    throw new ValidationError(`O ${fieldName} é obrigatório`);
  }

  // Valida usando core (com sanitização e segurança)
  const validation = validateCode(value, 1, maxLength);

  if (!validation.valid) {
    throw new ValidationError(`O ${fieldName} é inválido: ${validation.error}`);
  }

  // Retorna valor sanitizado
  return validation.sanitized!;
}

/**
 * Valida código de item
 *
 * @param codigo - Código a validar
 * @returns Código validado e sanitizado
 * @throws {ValidationError} Se inválido
 */
export function validateItemCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do item', 16);
}

/**
 * Valida código de estabelecimento
 *
 * @param codigo - Código a validar
 * @returns Código validado e sanitizado
 * @throws {ValidationError} Se inválido
 */
export function validateEstabelecimentoCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do estabelecimento', 16);
}

/**
 * Valida código de família
 *
 * @param codigo - Código a validar
 * @returns Código validado e sanitizado
 * @throws {ValidationError} Se inválido
 */
export function validateFamiliaCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código da família', 16);
}

/**
 * Valida código de família comercial
 *
 * @param codigo - Código a validar
 * @returns Código validado e sanitizado
 * @throws {ValidationError} Se inválido
 */
export function validateFamiliaComercialCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código da família comercial', 16);
}

/**
 * Valida código de grupo de estoque
 *
 * @param codigo - Código a validar
 * @returns Código validado e sanitizado
 * @throws {ValidationError} Se inválido
 */
export function validateGrupoDeEstoqueCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do grupo de estoque', 16);
}

/**
 * Valida código de depósito
 *
 * @param codigo - Código a validar
 * @returns Código validado e sanitizado
 * @throws {ValidationError} Se inválido
 */
export function validateDepositoCodigo(codigo: string | undefined): string {
  return validateRequiredParam(codigo, 'código do depósito', 16);
}
