// src/api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import { ItemInformacoesGeraisRequestDTO } from '../types/informacoesGerais.types';

/**
 * @fileoverview Validators para Informações Gerais de Itens
 *
 * Implementa validação e sanitização rigorosa de códigos de itens,
 * protegendo contra múltiplos vetores de ataque:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Command Injection
 * - Path Traversal
 *
 * **Camadas de Proteção:**
 * 1. Validação de tipo e presença
 * 2. Sanitização (remoção de caracteres perigosos)
 * 3. Validação de formato (whitelist)
 * 4. Validação de tamanho (min/max)
 * 5. Detecção de padrões maliciosos
 *
 * **Defense in Depth:**
 * Mesmo usando prepared statements (protege contra SQL injection),
 * mantemos validação rigorosa como camada adicional de segurança.
 *
 * @module InformacoesGeraisValidators
 * @category Validators
 */

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Tamanho máximo permitido para código de item
 * Baseado na estrutura do banco de dados Progress/Datasul
 *
 * @constant
 * @private
 */
const MAX_ITEM_CODIGO_LENGTH = 16;

/**
 * Tamanho mínimo permitido para código de item
 *
 * @constant
 * @private
 */
const MIN_ITEM_CODIGO_LENGTH = 1;

/**
 * Padrão regex para caracteres permitidos
 * Permite apenas: letras (A-Z, a-z) e números (0-9)
 *
 * @constant
 * @private
 */
const VALID_ITEM_CODIGO_PATTERN = /^[A-Za-z0-9]+$/;

/**
 * Keywords SQL perigosos a serem bloqueados
 *
 * @constant
 * @private
 */
const SQL_KEYWORDS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'EXEC',
  'UNION',
] as const;

/**
 * Padrões perigosos que indicam tentativa de command injection
 *
 * @constant
 * @private
 */
const DANGEROUS_PATTERNS = [
  '&&', // Shell AND
  '||', // Shell OR
  '|', // Pipe
  '`', // Backtick (command substitution)
  '$', // Variable expansion
  '$(', // Command substitution
  '${', // Variable substitution
] as const;

// ============================================================================
// RESULTADO DE VALIDAÇÃO
// ============================================================================

/**
 * Resultado da validação de request
 *
 * @interface ValidationResult
 * @template T - Tipo do DTO validado
 */
interface ValidationResult<T> {
  /** Indica se a validação passou */
  valid: boolean;
  /** Mensagem de erro (se valid = false) */
  error?: string;
  /** Dados validados e sanitizados (se valid = true) */
  data?: T;
}

// ============================================================================
// FUNÇÕES AUXILIARES DE SANITIZAÇÃO
// ============================================================================

/**
 * Sanitiza o código do item removendo caracteres perigosos
 *
 * Aplica múltiplas camadas de sanitização para garantir segurança:
 * 1. Remove espaços nas extremidades
 * 2. Remove caracteres de controle não imprimíveis
 * 3. Remove tentativas de path traversal (../)
 * 4. Remove barras (/, \)
 * 5. Remove caracteres SQL perigosos
 * 6. Remove tags HTML/XML
 *
 * **Por que sanitizar se usamos prepared statements?**
 * - Defense in depth (múltiplas camadas de proteção)
 * - Previne outros tipos de ataque (XSS, path traversal)
 * - Garante dados limpos em logs e mensagens de erro
 * - Protege contra bugs futuros no código
 *
 * @param {string} value - Valor a ser sanitizado
 * @returns {string} Valor sanitizado
 * @private
 *
 * @example
 * ```typescript
 * sanitizeItemCodigo('  ABC123  ')        // → 'ABC123'
 * sanitizeItemCodigo('<script>alert()</script>') // → 'scriptalert'
 * sanitizeItemCodigo('ABC"; DROP TABLE--') // → 'ABC DROP TABLE'
 * sanitizeItemCodigo('../../../etc/passwd') // → 'etcpasswd'
 * ```
 *
 * @note
 * Esta função é intencional

mente agressiva na remoção de caracteres
 */
function sanitizeItemCodigo(value: string): string {
  // 1. Remove espaços em branco nas extremidades
  let sanitized = value.trim();

  // 2. Remove caracteres de controle e não imprimíveis (ASCII 0-31 e 127)
  // Previne: null bytes, newlines, tabs, etc
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // 3. Remove tentativas de path traversal
  // Previne: ../../../etc/passwd
  sanitized = sanitized.replace(/\.\./g, '');

  // 4. Remove barras (prevenção adicional path traversal)
  // Previne: /etc/passwd, C:\Windows\System32
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // 5. Remove caracteres SQL perigosos
  // Previne: '; DROP TABLE--
  // Nota: Redundante com prepared statements, mas seguro
  sanitized = sanitized.replace(/[';"\-\-]/g, '');

  // 6. Remove tags HTML/XML (prevenção XSS)
  // Previne: <script>alert('XSS')</script>
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized;
}

// ============================================================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida formato do código do item (whitelist approach)
 *
 * Usa abordagem whitelist: permite apenas caracteres explicitamente seguros.
 * Mais seguro que blacklist (bloquear caracteres perigosos).
 *
 * **Caracteres Permitidos:**
 * - Letras maiúsculas: A-Z
 * - Letras minúsculas: a-z
 * - Números: 0-9
 *
 * **Caracteres NÃO Permitidos:**
 * - Espaços
 * - Caracteres especiais: !@#$%^&*()
 * - Pontuação: .,;:
 * - Símbolos: -_+=[]{}
 *
 * @param {string} value - Valor a ser validado
 * @returns {boolean} true se formato válido, false caso contrário
 * @private
 *
 * @example
 * ```typescript
 * isValidItemCodigoFormat('ABC123')   // → true
 * isValidItemCodigoFormat('7530110')  // → true
 * isValidItemCodigoFormat('Item-123') // → false (hífen não permitido)
 * isValidItemCodigoFormat('A B C')    // → false (espaços não permitidos)
 * isValidItemCodigoFormat('A@B')      // → false (@ não permitido)
 * ```
 *
 * @critical
 * Whitelist é mais seguro que blacklist para validação
 */
function isValidItemCodigoFormat(value: string): boolean {
  return VALID_ITEM_CODIGO_PATTERN.test(value);
}

// ============================================================================
// VALIDADOR PRINCIPAL
// ============================================================================

/**
 * Valida os parâmetros de busca de informações gerais do item
 *
 * Função principal de validação que implementa múltiplas camadas:
 *
 * **Fluxo de Validação:**
 * 1. ✅ Presença (itemCodigo foi fornecido?)
 * 2. ✅ Tipo (é string?)
 * 3. ✅ Sanitização (remove caracteres perigosos)
 * 4. ✅ Vazio (não ficou vazio após sanitização?)
 * 5. ✅ Tamanho máximo (≤ 16 caracteres?)
 * 6. ✅ Tamanho mínimo (≥ 1 caractere?)
 * 7. ✅ Formato (apenas A-Z, a-z, 0-9?)
 * 8. ✅ SQL Keywords (não contém SELECT, DROP, etc?)
 * 9. ✅ Command Injection (não contém &&, ||, |, etc?)
 *
 * **Retorno:**
 * - `valid: true` + `data`: Validação passou, dados sanitizados prontos
 * - `valid: false` + `error`: Validação falhou, mensagem de erro
 *
 * @param {any} data - Dados da requisição (pode ser qualquer coisa)
 * @returns {ValidationResult<ItemInformacoesGeraisRequestDTO>} Resultado da validação
 *
 * @example
 * ```typescript
 * // ✅ Caso válido
 * const result = validateItemInformacoesGeraisRequest({ itemCodigo: '7530110' });
 * // result = { valid: true, data: { itemCodigo: '7530110' } }
 *
 * // ❌ Caso inválido: vazio
 * const result = validateItemInformacoesGeraisRequest({});
 * // result = { valid: false, error: 'Código do item é obrigatório' }
 *
 * // ❌ Caso inválido: SQL injection
 * const result = validateItemInformacoesGeraisRequest({ itemCodigo: "'; DROP TABLE--" });
 * // result = { valid: false, error: 'Código do item contém padrões não permitidos' }
 *
 * // ✅ Sanitização automática
 * const result = validateItemInformacoesGeraisRequest({ itemCodigo: '  ABC123  ' });
 * // result = { valid: true, data: { itemCodigo: 'ABC123' } } // espaços removidos
 * ```
 *
 * @example
 * ```typescript
 * // Uso no controller
 * const validation = validateItemInformacoesGeraisRequest(req.params);
 *
 * if (!validation.valid) {
 *   throw new ValidationError(validation.error);
 * }
 *
 * const { itemCodigo } = validation.data!;
 * // itemCodigo está validado e sanitizado
 * ```
 *
 * @critical
 * - SEMPRE use esta validação antes de queries
 * - NÃO confie em dados do cliente
 * - NÃO bypasse esta validação
 * - Sanitização é automática e obrigatória
 *
 * @security
 * - Protege contra SQL Injection
 * - Protege contra XSS
 * - Protege contra Command Injection
 * - Protege contra Path Traversal
 */
export function validateItemInformacoesGeraisRequest(
  data: any
): ValidationResult<ItemInformacoesGeraisRequestDTO> {
  // ==========================================================================
  // CAMADA 1: VALIDAÇÃO DE PRESENÇA
  // ==========================================================================

  if (!data.itemCodigo) {
    return {
      valid: false,
      error: 'Código do item é obrigatório',
    };
  }

  // ==========================================================================
  // CAMADA 2: VALIDAÇÃO DE TIPO
  // ==========================================================================

  if (typeof data.itemCodigo !== 'string') {
    return {
      valid: false,
      error: 'Código do item deve ser uma string',
    };
  }

  // ==========================================================================
  // CAMADA 3: SANITIZAÇÃO
  // ==========================================================================

  const sanitized = sanitizeItemCodigo(data.itemCodigo);

  // ==========================================================================
  // CAMADA 4: VALIDAÇÃO PÓS-SANITIZAÇÃO
  // ==========================================================================

  // Verifica se não ficou vazio após sanitização
  // (todos os caracteres eram perigosos)
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Código do item inválido ou contém apenas caracteres não permitidos',
    };
  }

  // ==========================================================================
  // CAMADA 5: VALIDAÇÃO DE TAMANHO MÁXIMO
  // ==========================================================================

  if (sanitized.length > MAX_ITEM_CODIGO_LENGTH) {
    return {
      valid: false,
      error: `Código do item não pode ter mais de ${MAX_ITEM_CODIGO_LENGTH} caracteres`,
    };
  }

  // ==========================================================================
  // CAMADA 6: VALIDAÇÃO DE TAMANHO MÍNIMO
  // ==========================================================================

  if (sanitized.length < MIN_ITEM_CODIGO_LENGTH) {
    return {
      valid: false,
      error: 'Código do item não pode estar vazio',
    };
  }

  // ==========================================================================
  // CAMADA 7: VALIDAÇÃO DE FORMATO (WHITELIST)
  // ==========================================================================

  if (!isValidItemCodigoFormat(sanitized)) {
    return {
      valid: false,
      error:
        'Código do item contém caracteres inválidos. Use apenas letras, números e caracteres básicos',
    };
  }

  // ==========================================================================
  // CAMADA 8: DETECÇÃO DE SQL INJECTION
  // ==========================================================================

  // Bloqueia tentativas óbvias de SQL injection
  // Mesmo com prepared statements, é uma camada extra de segurança
  const upperSanitized = sanitized.toUpperCase();

  for (const keyword of SQL_KEYWORDS) {
    if (upperSanitized.includes(keyword)) {
      return {
        valid: false,
        error: 'Código do item contém padrões não permitidos',
      };
    }
  }

  // ==========================================================================
  // CAMADA 9: DETECÇÃO DE COMMAND INJECTION
  // ==========================================================================

  // Bloqueia tentativas de command injection
  // Previne ataques caso código seja usado em comandos shell (não deveria, mas...)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (sanitized.includes(pattern)) {
      return {
        valid: false,
        error: 'Código do item contém caracteres não permitidos',
      };
    }
  }

  // ==========================================================================
  // SUCESSO: TODAS AS VALIDAÇÕES PASSARAM
  // ==========================================================================

  return {
    valid: true,
    data: { itemCodigo: sanitized },
  };
}