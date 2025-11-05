// src/modules/engenharia/estrutura/services/ondeUsado.service.ts

import api from '../../../../shared/config/api.config';
import { OndeUsadoResponse, ItemPrincipalOndeUsado, ItemFinal } from '../types/ondeUsado.types';

// Configuração de retry
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeoutMs: 120000, // 120 segundos (Onde Usado pode ser complexo)
};

// Configuração de cache
const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutos em milissegundos
  maxSize: 50, // Máximo de 50 itens em cache
};

// Interface para entrada do cache
interface CacheEntry {
  data: ItemPrincipalOndeUsado | ItemFinal[];
  timestamp: number;
}

// Cache em memória
const cache = new Map<string, CacheEntry>();

/**
 * Limpa entradas expiradas do cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  cache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_CONFIG.ttl) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => cache.delete(key));

  // Se ainda exceder o tamanho máximo, remover as entradas mais antigas
  if (cache.size > CACHE_CONFIG.maxSize) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, cache.size - CACHE_CONFIG.maxSize);
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

/**
 * Obtém dados do cache se válidos
 */
function getFromCache(codigo: string): ItemPrincipalOndeUsado | ItemFinal[] | null {
  const entry = cache.get(codigo);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  if (age > CACHE_CONFIG.ttl) {
    cache.delete(codigo);
    return null;
  }

  return entry.data;
}

/**
 * Armazena dados no cache
 */
function setCache(codigo: string, data: ItemPrincipalOndeUsado | ItemFinal[]): void {
  cleanExpiredCache();

  cache.set(codigo, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Limpa todo o cache
 */
export function clearOndeUsadoCache(): void {
  cache.clear();
}

/**
 * Service para buscar Onde Usado (Where Used) - Consulta inversa da estrutura
 */
export const ondeUsadoService = {
  /**
   * Busca onde um componente é usado (estrutura inversa)
   * @param codigo - Código do componente
   * @param forceRefresh - Se true, ignora o cache e busca dados frescos da API
   * @param dataReferencia - Data de referência para filtrar (formato YYYY-MM-DD)
   * @param apenasFinais - Se true, retorna apenas itens finais em lista simples
   * @returns Promise com dados do Onde Usado
   */
  async getByCode(
    codigo: string,
    forceRefresh = false,
    dataReferencia?: string,
    apenasFinais = false
  ): Promise<ItemPrincipalOndeUsado | ItemFinal[]> {
    // Modificar cache key para diferenciar modos
    const cacheKey = apenasFinais ? `${codigo}_finais` : codigo;

    // Verificar cache primeiro (se não forçar refresh)
    if (!forceRefresh) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        // eslint-disable-next-line no-console
        console.log(
          `🔄 [Onde Usado] Cache HIT para item ${codigo} (modo: ${apenasFinais ? 'finais' : 'completo'})`
        );
        return cachedData;
      }
    }

    let lastError: any;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeoutMs);

        // Construir URL com parâmetros
        let url = `/api/engenharia/estrutura/ondeUsado/${codigo}`;
        const params = new URLSearchParams();
        if (dataReferencia) {
          params.append('dataReferencia', dataReferencia);
        }
        if (apenasFinais) {
          params.append('apenasFinais', 'true');
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        // eslint-disable-next-line no-console
        console.log(
          `🔍 [Onde Usado] Buscando item ${codigo} (modo: ${apenasFinais ? 'finais' : 'completo'}, tentativa ${attempt + 1})`
        );

        const response = await api.get<OndeUsadoResponse>(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        // Verificar sucesso
        if (!response.data.success || !response.data.data) {
          throw new Error('Dados não encontrados na resposta da API');
        }

        // eslint-disable-next-line no-console
        console.log(`✅ [Onde Usado] Item ${codigo} carregado com sucesso`);

        // Retornar dados corretos baseado no modo
        const data = apenasFinais
          ? response.data.data.listaFinais
          : response.data.data.itemPrincipal;

        if (!data) {
          throw new Error(`Dados não encontrados no modo ${apenasFinais ? 'finais' : 'completo'}`);
        }

        // Armazenar no cache antes de retornar
        setCache(cacheKey, data);

        // Retornar dados
        return data;
      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          console.warn(
            `⏱️  [Onde Usado] Tentativa ${attempt + 1} timeout após ${RETRY_CONFIG.timeoutMs}ms`
          );
        } else if (error.response) {
          // Erro HTTP - não fazer retry
          throw new Error(
            `Erro ao buscar onde usado do item ${codigo}: ${error.response.status} - ${
              error.response.data?.message || error.message
            }`
          );
        }

        // Aguardar antes de tentar novamente
        if (attempt < RETRY_CONFIG.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_CONFIG.retryDelay));
        }
      }
    }

    throw new Error(
      `Falha ao buscar onde usado do item ${codigo} após ${RETRY_CONFIG.maxRetries + 1} tentativas: ${
        lastError?.message || 'Erro desconhecido'
      }`
    );
  },

  /**
   * Invalida o cache de um item específico
   */
  invalidateCache(codigo: string): void {
    cache.delete(codigo);
    // eslint-disable-next-line no-console
    console.log(`🗑️  [Onde Usado] Cache invalidado para item ${codigo}`);
  },

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(cache.entries());

    return {
      size: cache.size,
      maxSize: CACHE_CONFIG.maxSize,
      ttl: CACHE_CONFIG.ttl,
      entries: entries.map(([codigo, entry]) => ({
        codigo,
        age: Math.round((now - entry.timestamp) / 1000),
        remaining: Math.round((CACHE_CONFIG.ttl - (now - entry.timestamp)) / 1000),
      })),
    };
  },
};
