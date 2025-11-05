// tests/fixtures/database.fixtures.ts

/**
 * Fixtures para Respostas de Banco de Dados
 *
 * Simula respostas típicas do banco de dados Datasul (Progress OpenEdge via SQL Server).
 * Útil para testes de integração e testes de repositórios.
 */

// ============================================================================
// RAW DATABASE RESPONSES
// ============================================================================

/**
 * Resposta típica do banco para um item
 */
export interface RawItemRow {
  'it-codigo': string;
  'desc-item': string;
  'un': string;
  'log1-item'?: string; // Ativo/Inativo
  'cod-lin-prod'?: string; // Família
  'cod-grp-estoque'?: string; // Grupo de Estoque
  'ean'?: string; // GTIN/EAN
  [key: string]: any; // Outros campos dinâmicos
}

export class DatabaseItemBuilder {
  private static defaults: RawItemRow = {
    'it-codigo': 'TEST001',
    'desc-item': 'ITEM DE TESTE',
    'un': 'UN',
    'log1-item': 'yes',
  };

  static build(overrides?: Partial<RawItemRow>): RawItemRow {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildTorneira(): RawItemRow {
    return this.build({
      'it-codigo': '7530110',
      'desc-item': 'TORNEIRA MONOCOMANDO CROMADA',
      'un': 'UN',
      'cod-lin-prod': 'FM-MET',
      'cod-grp-estoque': '01',
      'ean': '7891234567890',
    });
  }

  static buildInativo(): RawItemRow {
    return this.build({
      'it-codigo': 'INATIVO001',
      'desc-item': 'ITEM INATIVO',
      'log1-item': 'no',
    });
  }

  static buildMany(count: number, overrides?: Partial<RawItemRow>): RawItemRow[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        'it-codigo': `ITEM${i.toString().padStart(3, '0')}`,
        'desc-item': `ITEM ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// RAW FAMILIA RESPONSES
// ============================================================================

export interface RawFamiliaRow {
  'cod-lin-prod': string;
  'desc-lin-prod': string;
  [key: string]: any;
}

export class DatabaseFamiliaBuilder {
  private static defaults: RawFamiliaRow = {
    'cod-lin-prod': 'FM001',
    'desc-lin-prod': 'FAMILIA DE TESTE',
  };

  static build(overrides?: Partial<RawFamiliaRow>): RawFamiliaRow {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildMetais(): RawFamiliaRow {
    return this.build({
      'cod-lin-prod': 'FM-MET',
      'desc-lin-prod': 'METAIS SANITARIOS',
    });
  }

  static buildMany(count: number): RawFamiliaRow[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        'cod-lin-prod': `FM${i.toString().padStart(3, '0')}`,
        'desc-lin-prod': `FAMILIA ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// RAW GRUPO ESTOQUE RESPONSES
// ============================================================================

export interface RawGrupoEstoqueRow {
  'cod-grp-estoque': string;
  'desc-grp-estoque': string;
  [key: string]: any;
}

export class DatabaseGrupoEstoqueBuilder {
  private static defaults: RawGrupoEstoqueRow = {
    'cod-grp-estoque': '01',
    'desc-grp-estoque': 'GRUPO DE TESTE',
  };

  static build(overrides?: Partial<RawGrupoEstoqueRow>): RawGrupoEstoqueRow {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildMateriais(): RawGrupoEstoqueRow {
    return this.build({
      'cod-grp-estoque': '01',
      'desc-grp-estoque': 'MATERIAIS',
    });
  }

  static buildMany(count: number): RawGrupoEstoqueRow[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        'cod-grp-estoque': (i + 1).toString().padStart(2, '0'),
        'desc-grp-estoque': `GRUPO ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// RAW ESTABELECIMENTO RESPONSES
// ============================================================================

export interface RawEstabelecimentoRow {
  'cod-estabel': string;
  'nome-abrev': string;
  [key: string]: any;
}

export class DatabaseEstabelecimentoBuilder {
  private static defaults: RawEstabelecimentoRow = {
    'cod-estabel': '001',
    'nome-abrev': 'ESTABELECIMENTO TESTE',
  };

  static build(overrides?: Partial<RawEstabelecimentoRow>): RawEstabelecimentoRow {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildMatriz(): RawEstabelecimentoRow {
    return this.build({
      'cod-estabel': '001',
      'nome-abrev': 'MATRIZ',
    });
  }

  static buildMany(count: number): RawEstabelecimentoRow[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        'cod-estabel': (i + 1).toString().padStart(3, '0'),
        'nome-abrev': `ESTABELECIMENTO ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// QUERY RESULT BUILDERS
// ============================================================================

/**
 * Simula resultado de query do MSSQL/ODBC
 */
export interface QueryResult<T = any> {
  recordset: T[];
  recordsets: T[][];
  output: Record<string, any>;
  rowsAffected: number[];
}

export class QueryResultBuilder {
  static build<T>(rows: T[]): QueryResult<T> {
    return {
      recordset: rows,
      recordsets: [rows],
      output: {},
      rowsAffected: [rows.length],
    };
  }

  static buildEmpty<T>(): QueryResult<T> {
    return this.build([]);
  }

  static buildSingle<T>(row: T): QueryResult<T> {
    return this.build([row]);
  }

  static buildMany<T>(rows: T[]): QueryResult<T> {
    return this.build(rows);
  }
}

// ============================================================================
// COMPLETE SCENARIOS
// ============================================================================

/**
 * Cenários completos de banco de dados para testes
 */
export class DatabaseScenarios {
  /**
   * Cenário: Item com todas as relações no banco
   */
  static itemCompletoRaw() {
    return {
      item: DatabaseItemBuilder.buildTorneira(),
      familia: DatabaseFamiliaBuilder.buildMetais(),
      grupoEstoque: DatabaseGrupoEstoqueBuilder.buildMateriais(),
      estabelecimento: DatabaseEstabelecimentoBuilder.buildMatriz(),
    };
  }

  /**
   * Cenário: Query retornando múltiplos items
   */
  static queryMultiplosItems(count: number = 10) {
    return QueryResultBuilder.buildMany(
      DatabaseItemBuilder.buildMany(count)
    );
  }

  /**
   * Cenário: Query retornando item único
   */
  static queryItemUnico(codigo: string = 'TEST001') {
    return QueryResultBuilder.buildSingle(
      DatabaseItemBuilder.build({ 'it-codigo': codigo })
    );
  }

  /**
   * Cenário: Query retornando vazio (item não encontrado)
   */
  static queryItemNaoEncontrado() {
    return QueryResultBuilder.buildEmpty<RawItemRow>();
  }

  /**
   * Cenário: Erro de banco de dados
   */
  static erroConexao() {
    const error = new Error('Connection failed');
    (error as any).code = 'ECONNREFUSED';
    (error as any).number = -1;
    return error;
  }

  /**
   * Cenário: Erro de timeout
   */
  static erroTimeout() {
    const error = new Error('Request timeout');
    (error as any).code = 'ETIMEOUT';
    (error as any).timeout = 30000;
    return error;
  }

  /**
   * Cenário: Erro de sintaxe SQL
   */
  static erroSintaxeSQL() {
    const error = new Error('Incorrect syntax near \'SELECT\'');
    (error as any).code = 'EREQUEST';
    (error as any).number = 102;
    (error as any).lineNumber = 1;
    return error;
  }
}

// ============================================================================
// PARAMETER BUILDERS
// ============================================================================

/**
 * Construtor de parâmetros SQL para queries parametrizadas
 */
export interface SqlParameter {
  name: string;
  type: string;
  value: any;
}

export class SqlParameterBuilder {
  static build(name: string, type: string, value: any): SqlParameter {
    return { name, type, value };
  }

  static buildVarchar(name: string, value: string): SqlParameter {
    return this.build(name, 'varchar', value);
  }

  static buildInt(name: string, value: number): SqlParameter {
    return this.build(name, 'int', value);
  }

  static buildBoolean(name: string, value: boolean): SqlParameter {
    return this.build(name, 'bit', value);
  }

  static buildItemCodigo(codigo: string): SqlParameter {
    return this.buildVarchar('codigo', codigo);
  }

  static buildMany(params: Array<{ name: string; type: string; value: any }>): SqlParameter[] {
    return params.map(p => this.build(p.name, p.type, p.value));
  }
}

// ============================================================================
// CONNECTION MOCK BUILDERS
// ============================================================================

/**
 * Mock de conexão de banco de dados
 */
export class MockDatabaseConnectionBuilder {
  static build() {
    return {
      request: jest.fn().mockReturnValue({
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
      }),
      close: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
    };
  }

  static buildWithResult<T>(result: QueryResult<T>) {
    const connection = this.build();
    connection.request().query.mockResolvedValue(result);
    return connection;
  }

  static buildWithError(error: Error) {
    const connection = this.build();
    connection.request().query.mockRejectedValue(error);
    return connection;
  }
}
