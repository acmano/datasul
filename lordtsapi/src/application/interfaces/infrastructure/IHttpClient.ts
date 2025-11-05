// src/application/interfaces/infrastructure/IHttpClient.ts

/**
 * Interface de HTTP Client (Port)
 *
 * @description
 * Abstração para chamadas HTTP externas.
 * Facilita testes e permite trocar implementação (axios, fetch, etc).
 *
 * @example
 * ```typescript
 * class IntegrationService {
 *   constructor(private httpClient: IHttpClient) {}
 *
 *   async callExternalAPI(data: any): Promise<Response> {
 *     return await this.httpClient.post('https://api.example.com/data', data);
 *   }
 * }
 * ```
 */
export interface IHttpClient {
  /**
   * GET request
   */
  get<T = any>(url: string, config?: HttpConfig): Promise<HttpResponse<T>>;

  /**
   * POST request
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<HttpResponse<T>>;

  /**
   * PUT request
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<HttpResponse<T>>;

  /**
   * DELETE request
   */
  delete<T = any>(url: string, config?: HttpConfig): Promise<HttpResponse<T>>;

  /**
   * PATCH request
   */
  patch<T = any>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<HttpResponse<T>>;
}

export interface HttpConfig {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
