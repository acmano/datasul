/**
 * Padrões de segurança para validação de códigos
 *
 * @module core/constants/securityPatterns
 * @since 2.0.0
 */

/**
 * Palavras-chave SQL que não devem aparecer em códigos
 */
export const SQL_KEYWORDS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'EXEC',
  'EXECUTE',
  'UNION',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
] as const;

/**
 * Padrões perigosos que indicam tentativa de injection
 */
export const DANGEROUS_PATTERNS = ['&&', '||', '|', '`', '$', '$(', '${'] as const;

/**
 * Caracteres de controle que devem ser removidos
 */
// eslint-disable-next-line no-control-regex
export const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/g;

/**
 * Pattern para detectar path traversal
 */
export const PATH_TRAVERSAL_REGEX = /\.\./g;

/**
 * Pattern para detectar separadores de path
 */
export const PATH_SEPARATORS_REGEX = /[/\\]/g;

/**
 * Pattern para detectar caracteres SQL perigosos
 */
export const SQL_DANGEROUS_CHARS_REGEX = /[';"--]/g;

/**
 * Pattern para detectar tags HTML/XML
 */
export const HTML_TAGS_REGEX = /<[^>]*>/g;
