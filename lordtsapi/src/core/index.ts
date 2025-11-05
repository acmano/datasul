/**
 * Core - Lógica de Negócio Pura
 *
 * Este módulo contém lógica de domínio sem dependências externas:
 * - Validators: Validações de domínio puras
 * - Utils: Utilitários sem side effects
 * - Constants: Constantes do domínio
 *
 * REGRAS:
 * - Não pode depender de bibliotecas externas (exceto tipos)
 * - Não pode depender de infraestrutura (DB, cache, HTTP)
 * - Funções devem ser puras (mesma entrada = mesma saída)
 * - Sem side effects (logs, I/O, etc)
 *
 * @module core
 * @since 2.0.0
 */

export * from './constants';
export * from './validators';
export * from './utils';
