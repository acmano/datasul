/**
 * Helpers para construção de queries OPENQUERY padrão
 */

import { QueryParameter } from '@infrastructure/database/types';

/**
 * Monta query OPENQUERY padrão para buscar entidade por código
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
 */
export function createCodigoParam(paramName: string, value: string): QueryParameter {
  return {
    name: paramName,
    type: 'varchar',
    value
  };
}

/**
 * Valida se código é válido
 */
export function isValidCode(code: any): code is string {
  return code !== null && 
         code !== undefined && 
         typeof code === 'string' && 
         code.trim() !== '';
}
