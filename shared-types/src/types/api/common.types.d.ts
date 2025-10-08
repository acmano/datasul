/**
 * Response genérico da API
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
/**
 * Request genérico com código
 */
export interface CodigoRequestDTO {
    codigo: string;
}
