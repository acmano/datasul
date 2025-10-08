/**
 * Dados de família (unificado)
 */
export interface FamiliaData {
  codigo: string;
  descricao: string;
}

/**
 * Resultado da query de família master
 */
export interface FamiliaMasterQueryResult {
  familiaCodigo: string;
  familiaDescricao: string;
}

/**
 * Informações gerais de uma família
 * @deprecated Use FamiliaData para consistência
 */
export interface FamiliaInformacoesGerais extends FamiliaData {
  familiaCodigo: string;
  familiaDescricao: string;
}
