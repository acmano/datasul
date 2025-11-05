/**
 * Types - Suprimentos Fornecedores
 *
 * Tipos para dados de fornecedores
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface para dados de fornecedor
 */
export interface FornecedorData {
  // TODO: Adicionar campos após definição de requisitos
  codigo?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  status?: string;
}

/**
 * Endereço do fornecedor
 */
export interface EnderecoFornecedor {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
}

/**
 * Contato do fornecedor
 */
export interface ContatoFornecedor {
  nome?: string;
  cargo?: string;
  telefone?: string;
  email?: string;
}

/**
 * Dados completos do fornecedor
 */
export interface FornecedorCompleto extends FornecedorData {
  endereco?: EnderecoFornecedor;
  contatos?: ContatoFornecedor[];
  dataInicio?: string;
  dataUltimaCompra?: string;
}

/**
 * Itens fornecidos por um fornecedor
 */
export interface ItemFornecido {
  itemCodigo: string;
  itemDescricao?: string;
  prazoEntrega?: number;
  precoUnitario?: number;
  unidade?: string;
}

/**
 * Resposta padrão da API
 */
export interface FornecedorResponse {
  success: boolean;
  data: FornecedorData | FornecedorData[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface FornecedorParams {
  codigo?: string;
  razaoSocial?: string;
  cnpj?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status/categorias
