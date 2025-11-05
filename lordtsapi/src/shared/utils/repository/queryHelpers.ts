/**
 * Helpers para construção de queries OPENQUERY padrão
 *
 * @module shared/utils/repository/queryHelpers
 * @since 1.0.0
 */

import { QueryParameter } from '@infrastructure/database/types';

/**
 * Monta query OPENQUERY padrão para buscar entidade por código
 *
 * @param options - Opções da query
 * @returns Query SQL montada
 */
export function buildOpenQuerySelect(options: {
  linkServer: string;
  table: string;
  columns: string[];
  whereColumn: string;
  paramName: string;
}): string {
  const { linkServer, table, columns, whereColumn, paramName } = options;

  const columnsStr = columns.join('\n                    , ');

  return `
    DECLARE @codigo varchar(16) = @${paramName};
    DECLARE @sql nvarchar(max);

    SET @sql = N'
      SELECT  ${columnsStr}
      FROM  OPENQUERY (
        ${linkServer}
      ,  ''SELECT  ${columns.join(', ')}
             FROM   ${table}
             WHERE  "${whereColumn}" = ''''' + @codigo + '''''
         ''
      ) as result
    ';

    EXEC sp_executesql @sql;
  `;
}

/**
 * Cria parâmetro padrão para código
 *
 * @param paramName - Nome do parâmetro
 * @param value - Valor do parâmetro
 * @returns Parâmetro formatado
 */
export function createCodigoParam(paramName: string, value: string): QueryParameter {
  return {
    name: paramName,
    type: 'varchar',
    value,
  };
}

// Re-exporta isValidCode do core
export { isValidCode } from '@/core/utils/typeGuards';
