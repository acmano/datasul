/**
 * Health Check Service
 *
 * Verifica a saúde da aplicação frontend e conectividade com backend
 */

import * as React from 'react';
import api from '../config/api.config';
import { env } from '../utils/env';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  backend: {
    reachable: boolean;
    responseTime?: number;
    error?: string;
  };
  frontend: {
    reactVersion: string;
    environment: string;
  };
}

/**
 * Verifica a saúde do backend
 */
async function checkBackendHealth(): Promise<{
  reachable: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = performance.now();

  try {
    // Tenta fazer um request ao endpoint de health do backend
    const response = await api.get('/health', {
      timeout: 5000, // 5 segundos timeout
    });

    const responseTime = Math.round(performance.now() - startTime);

    if (response.status === 200) {
      return {
        reachable: true,
        responseTime,
      };
    }

    return {
      reachable: false,
      error: `Unexpected status code: ${response.status}`,
    };
  } catch (error: any) {
    const responseTime = Math.round(performance.now() - startTime);

    return {
      reachable: false,
      responseTime,
      error: error.message || 'Connection failed',
    };
  }
}

/**
 * Executa health check completo da aplicação
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const backendHealth = await checkBackendHealth();

  // Determina status geral
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (backendHealth.reachable) {
    if (backendHealth.responseTime && backendHealth.responseTime < 1000) {
      status = 'healthy';
    } else {
      status = 'degraded'; // Backend lento
    }
  } else {
    status = 'unhealthy'; // Backend não acessível
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: env.VERSION || 'unknown',
    backend: backendHealth,
    frontend: {
      reactVersion: React.version || 'unknown',
      environment: env.IS_DEV ? 'development' : 'production',
    },
  };
}

/**
 * Retorna health check em formato simples para endpoints
 */
export async function getHealthCheckResponse(): Promise<{
  status: string;
  timestamp: string;
}> {
  const health = await performHealthCheck();

  return {
    status: health.status,
    timestamp: health.timestamp,
  };
}
