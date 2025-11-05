// src/item/itemEmpresas/types.ts

export interface ItemEmpresasParams {
  codigo: string;
}

export interface ItemEmpresaQueryResult {
  itemCodigo: string;
  estabelecimentoCodigo: string;
  estabelecimentoNome: string;
}

export interface EmpresaResult {
  codigo: string;
  nome: string;
}

export interface ItemEmpresasResponse {
  success: true;
  data: {
    codigo: string;
    empresas: EmpresaResult[];
  };
  total: number;
}
