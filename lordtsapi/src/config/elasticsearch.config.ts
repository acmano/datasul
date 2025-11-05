// src/config/elasticsearch.config.ts

import { Client } from '@elastic/elasticsearch';

/**
 * Configuração do cliente Elasticsearch
 * @module ElasticsearchConfig
 */

export interface ElasticsearchConfig {
  enabled: boolean;
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  indexPrefix: string;
  maxRetries: number;
  requestTimeout: number;
  sniffOnStart: boolean;
  sniffInterval: number | false;
}

/**
 * Carrega configuração do Elasticsearch das variáveis de ambiente
 */
export function getElasticsearchConfig(): ElasticsearchConfig {
  return {
    enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth:
      process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
          }
        : undefined,
    indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'lordtsapi-logs',
    maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3', 10),
    requestTimeout: parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '30000', 10),
    sniffOnStart: process.env.ELASTICSEARCH_SNIFF_ON_START === 'true',
    sniffInterval:
      process.env.ELASTICSEARCH_SNIFF_INTERVAL === 'false'
        ? false
        : parseInt(process.env.ELASTICSEARCH_SNIFF_INTERVAL || '300000', 10),
  };
}

/**
 * Singleton do cliente Elasticsearch
 */
let elasticsearchClient: Client | null = null;

/**
 * Obtém ou cria o cliente Elasticsearch
 */
export function getElasticsearchClient(): Client | null {
  const config = getElasticsearchConfig();

  if (!config.enabled) {
    return null;
  }

  if (!elasticsearchClient) {
    elasticsearchClient = new Client({
      node: config.node,
      auth: config.auth,
      maxRetries: config.maxRetries,
      requestTimeout: config.requestTimeout,
      sniffOnStart: config.sniffOnStart,
      sniffInterval: config.sniffInterval,
      tls: {
        // Aceita certificados auto-assinados (comum em ambientes locais)
        rejectUnauthorized: false,
      },
    });
  }

  return elasticsearchClient;
}

/**
 * Verifica se o Elasticsearch está disponível
 */
export async function checkElasticsearchHealth(): Promise<{
  available: boolean;
  version?: string;
  clusterName?: string;
  error?: string;
}> {
  const client = getElasticsearchClient();

  if (!client) {
    return {
      available: false,
      error: 'Elasticsearch não está habilitado',
    };
  }

  try {
    const health = await client.info();
    return {
      available: true,
      version: health.version?.number,
      clusterName: health.cluster_name,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Fecha a conexão com Elasticsearch
 */
export async function closeElasticsearchClient(): Promise<void> {
  if (elasticsearchClient) {
    await elasticsearchClient.close();
    elasticsearchClient = null;
  }
}
