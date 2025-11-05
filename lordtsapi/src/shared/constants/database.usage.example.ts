/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * EXEMPLO DE USO - Database Constants
 *
 * Este arquivo demonstra como usar as constantes compartilhadas
 * do @acmano/lordtsapi-shared-types em repositories.
 */

import {
  LINKED_SERVERS,
  PROGRESS_TABLES,
  QUERY_CONFIG,
  getProgressColumn,
} from '@acmano/lordtsapi-shared-types';

/**
 * ANTES (hardcoded):
 */
const _queryAntes = `
  SELECT item."it-codigo" as itemCodigo
  FROM OPENQUERY (
    PRD_EMS2EMP,
    'SELECT item."it-codigo"
     FROM pub.item item
     WHERE item."it-codigo" = ''...'
  )
`;

/**
 * DEPOIS (usando constants):
 */
const _queryDepois = `
  SELECT item.${getProgressColumn('it-codigo')} as itemCodigo
  FROM OPENQUERY (
    ${LINKED_SERVERS.PRD_EMS2EMP},
    'SELECT item.${getProgressColumn('it-codigo')}
     FROM ${PROGRESS_TABLES.ITEM} item
     WHERE item.${getProgressColumn('it-codigo')} = ''...'
  )
`;

/**
 * Benefícios:
 * - ✓ Fácil mudança de linked server (único lugar)
 * - ✓ Autocomplete no IDE
 * - ✓ Type-safe
 * - ✓ Refactoring seguro
 * - ✓ Documentação inline
 */

// Limites configuráveis
const _maxEstabelecimentos = QUERY_CONFIG.MAX_ESTABELECIMENTOS_PARALELO;
const _timeout = QUERY_CONFIG.DEFAULT_TIMEOUT;
