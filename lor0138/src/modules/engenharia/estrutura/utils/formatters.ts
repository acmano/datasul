// src/modules/engenharia/estrutura/utils/formatters.ts

/**
 * Formata código de item com estabelecimento no formato: codigo (estab)
 * @param codigo - Código do item
 * @param estabelecimento - Código do estabelecimento (opcional)
 * @returns String formatada no formato "codigo (estab)" ou apenas "codigo" se estabelecimento não existir
 */
export const formatarCodigoComEstab = (codigo: string, estabelecimento?: string | null): string => {
  // Se não tem estabelecimento ou é vazio, retorna só o código
  if (!estabelecimento || estabelecimento.trim() === '') {
    return codigo;
  }

  // Retorna no formato: codigo (estab)
  return `${codigo} (${estabelecimento})`;
};

/**
 * Extrai apenas o código (sem estabelecimento) de uma string formatada
 * Usado para manter compatibilidade com busca/filtro
 * @param codigoFormatado - String no formato "codigo (estab)" ou "codigo"
 * @returns Apenas o código
 */
export const extrairCodigo = (codigoFormatado: string): string => {
  const match = codigoFormatado.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : codigoFormatado;
};
