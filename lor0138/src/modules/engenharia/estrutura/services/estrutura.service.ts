// src/modules/engenharia/estrutura/services/estrutura.service.ts

import api from '../../../../shared/config/api.config';
import { EstruturaResponse, ItemPrincipal } from '../types/estrutura.types';

// Configuração de retry
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeoutMs: 30000,
};

// Configuração de cache
const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutos em milissegundos
  maxSize: 50, // Máximo de 50 itens em cache
};

// Interface para entrada do cache
interface CacheEntry {
  data: ItemPrincipal;
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
function getFromCache(codigo: string): ItemPrincipal | null {
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
function setCache(codigo: string, data: ItemPrincipal): void {
  cleanExpiredCache();

  cache.set(codigo, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Limpa todo o cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Service para buscar estrutura de engenharia (BOM)
 */
export const estruturaService = {
  /**
   * Busca estrutura completa de um item pelo código
   * @param codigo - Código do item
   * @param forceRefresh - Se true, ignora o cache e busca dados frescos da API
   * @param dataReferencia - Data de referência para filtrar componentes (formato YYYY-MM-DD)
   * @returns Promise com dados da estrutura
   */
  async getByCode(
    codigo: string,
    forceRefresh = false,
    dataReferencia?: string
  ): Promise<ItemPrincipal> {
    // Verificar cache primeiro (se não forçar refresh)
    if (!forceRefresh) {
      const cachedData = getFromCache(codigo);
      if (cachedData) {
        return cachedData;
      }
    }

    let lastError: any;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeoutMs);

        const url = dataReferencia
          ? `/api/engenharia/estrutura/informacoesGerais/${codigo}?dataReferencia=${dataReferencia}`
          : `/api/engenharia/estrutura/informacoesGerais/${codigo}`;

        const response = await api.get<EstruturaResponse>(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        // Verificar sucesso
        if (!response.data.success || !response.data.data) {
          throw new Error('Dados não encontrados na resposta da API');
        }

        // Armazenar no cache antes de retornar
        const itemPrincipal = response.data.data.itemPrincipal;
        setCache(codigo, itemPrincipal);

        // Retornar itemPrincipal
        return itemPrincipal;
      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          console.warn(`Tentativa ${attempt + 1} timeout após ${RETRY_CONFIG.timeoutMs}ms`);
        } else if (error.response) {
          // Erro HTTP - não fazer retry
          throw new Error(
            `Erro ao buscar estrutura do item ${codigo}: ${error.response.status} - ${
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
      `Falha ao buscar estrutura do item ${codigo} após ${RETRY_CONFIG.maxRetries + 1} tentativas: ${
        lastError?.message || 'Erro desconhecido'
      }`
    );
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
