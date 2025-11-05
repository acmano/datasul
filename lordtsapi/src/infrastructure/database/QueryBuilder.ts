// src/infrastructure/database/QueryBuilder.ts

import type { QueryParameter } from './types';

/**
 * Query Builder - Builder Pattern
 *
 * @description
 * Construtor fluente para queries SQL complexas.
 * Facilita criação de queries dinâmicas com segurança.
 *
 * @example
 * ```typescript
 * const query = new QueryBuilder()
 *   .select('it-codigo', 'desc-item', 'un')
 *   .from('OPENQUERY(PRD_EMS2EMP, \'SELECT * FROM item\')')
 *   .where('it-codigo', '=', itemCodigo)
 *   .and('cod-obsoleto', '=', 1)
 *   .orderBy('desc-item', 'ASC')
 *   .limit(10)
 *   .build();
 * ```
 */
export class QueryBuilder {
  private selectFields: string[] = [];
  private fromClause: string = '';
  private whereConditions: WhereCondition[] = [];
  private orderByFields: OrderByField[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private parameters: QueryParameter[] = [];

  /**
   * Define campos SELECT
   *
   * @param fields - Campos a selecionar
   * @returns this (fluent interface)
   */
  select(...fields: string[]): this {
    this.selectFields.push(...fields);
    return this;
  }

  /**
   * Define tabela/fonte FROM
   *
   * @param table - Nome da tabela ou OPENQUERY
   * @returns this
   */
  from(table: string): this {
    this.fromClause = table;
    return this;
  }

  /**
   * Adiciona condição WHERE
   *
   * @param field - Campo
   * @param operator - Operador (=, !=, >, <, LIKE, etc)
   * @param value - Valor
   * @returns this
   */
  where(field: string, operator: string, value: unknown): this {
    this.whereConditions.push({
      type: 'AND',
      field,
      operator,
      value,
      paramName: `param${this.parameters.length}`,
    });

    this.addParameter(value);
    return this;
  }

  /**
   * Adiciona condição AND
   *
   * @param field - Campo
   * @param operator - Operador
   * @param value - Valor
   * @returns this
   */
  and(field: string, operator: string, value: unknown): this {
    return this.where(field, operator, value);
  }

  /**
   * Adiciona condição OR
   *
   * @param field - Campo
   * @param operator - Operador
   * @param value - Valor
   * @returns this
   */
  or(field: string, operator: string, value: unknown): this {
    this.whereConditions.push({
      type: 'OR',
      field,
      operator,
      value,
      paramName: `param${this.parameters.length}`,
    });

    this.addParameter(value);
    return this;
  }

  /**
   * Adiciona WHERE com IN
   *
   * @param field - Campo
   * @param values - Array de valores
   * @returns this
   */
  whereIn(field: string, values: unknown[]): this {
    const paramNames = values.map((_, i) => `@param${this.parameters.length + i}`);

    this.whereConditions.push({
      type: 'AND',
      field,
      operator: 'IN',
      value: values,
      paramName: '',
      inClause: `(${paramNames.join(', ')})`,
    });

    values.forEach((val) => this.addParameter(val));
    return this;
  }

  /**
   * Adiciona ORDER BY
   *
   * @param field - Campo
   * @param direction - ASC ou DESC
   * @returns this
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByFields.push({ field, direction });
    return this;
  }

  /**
   * Define LIMIT
   *
   * @param limit - Quantidade de registros
   * @returns this
   */
  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Define OFFSET
   *
   * @param offset - Deslocamento
   * @returns this
   */
  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Adiciona parâmetro
   * @private
   */
  private addParameter(value: unknown): void {
    const type = this.inferType(value);
    this.parameters.push({
      name: `param${this.parameters.length}`,
      type,
      value,
    });
  }

  /**
   * Infere tipo SQL do valor
   * @private
   */
  private inferType(value: unknown): string {
    if (typeof value === 'string') return 'varchar';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'decimal';
    }
    if (typeof value === 'boolean') return 'bit';
    if (value instanceof Date) return 'datetime';
    return 'varchar';
  }

  /**
   * Constrói query SQL
   *
   * @returns Objeto com query e parâmetros
   */
  build(): QueryResult {
    if (!this.fromClause) {
      throw new Error('FROM clause is required');
    }

    let sql = '';

    // SELECT
    if (this.selectFields.length > 0) {
      sql += `SELECT ${this.selectFields.join(', ')}\n`;
    } else {
      sql += 'SELECT *\n';
    }

    // FROM
    sql += `FROM ${this.fromClause}\n`;

    // WHERE
    if (this.whereConditions.length > 0) {
      sql += 'WHERE ';
      sql += this.whereConditions
        .map((cond, index) => {
          const prefix = index === 0 ? '' : `${cond.type} `;
          if (cond.inClause) {
            return `${prefix}${cond.field} ${cond.operator} ${cond.inClause}`;
          }
          return `${prefix}${cond.field} ${cond.operator} @${cond.paramName}`;
        })
        .join(' ');
      sql += '\n';
    }

    // ORDER BY
    if (this.orderByFields.length > 0) {
      sql += 'ORDER BY ';
      sql += this.orderByFields
        .map((field) => `${field.field} ${field.direction}`)
        .join(', ');
      sql += '\n';
    }

    // OFFSET/FETCH (SQL Server pagination)
    if (this.offsetValue !== undefined || this.limitValue !== undefined) {
      const offset = this.offsetValue ?? 0;
      const limit = this.limitValue ?? 100;

      sql += `OFFSET ${offset} ROWS\n`;
      sql += `FETCH NEXT ${limit} ROWS ONLY\n`;
    }

    return {
      sql: sql.trim(),
      parameters: this.parameters,
    };
  }

  /**
   * Retorna apenas a string SQL (sem parâmetros)
   *
   * @returns SQL string
   */
  toSQL(): string {
    return this.build().sql;
  }

  /**
   * Retorna parâmetros
   *
   * @returns Array de parâmetros
   */
  getParameters(): QueryParameter[] {
    return this.parameters;
  }

  /**
   * Reset do builder
   *
   * @returns this
   */
  reset(): this {
    this.selectFields = [];
    this.fromClause = '';
    this.whereConditions = [];
    this.orderByFields = [];
    this.limitValue = undefined;
    this.offsetValue = undefined;
    this.parameters = [];
    return this;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface WhereCondition {
  type: 'AND' | 'OR';
  field: string;
  operator: string;
  value: unknown;
  paramName: string;
  inClause?: string;
}

interface OrderByField {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryResult {
  sql: string;
  parameters: QueryParameter[];
}
