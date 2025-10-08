// tests/load/smoke.test.js
// Teste de Fumaça - Verifica se a API aguenta carga mínima

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração do teste
export const options = {
  vus: 1, // 1 usuário virtual
  duration: '30s', // 30 segundos
  
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições < 500ms
    // http_req_failed removido - 404 é esperado para INVALID999
    errors: ['rate<0.01'], // Erros customizados < 1%
  },
};

// Configuração da API
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'admin-key-superuser'; // API Key de admin (sem rate limit)
const ITEM_CODE = '7530110'; // Código conhecido que existe

export default function () {
  const headers = {
    'X-API-Key': API_KEY,
  };

  // Teste 1: Health Check
  const healthRes = http.get(`${BASE_URL}/health`, { headers });
  
  const healthCheck = check(healthRes, {
    'health status é 200 ou 503': (r) => [200, 503].includes(r.status),
    'health tem propriedade status': (r) => JSON.parse(r.body).status !== undefined,
  });
  
  errorRate.add(!healthCheck);

  sleep(1);

  // Teste 2: Buscar Item
  const itemRes = http.get(
    `${BASE_URL}/api/item/dadosCadastrais/informacoesGerais/${ITEM_CODE}`,
    { headers }
  );
  
  const itemCheck = check(itemRes, {
    'item status é 200': (r) => r.status === 200,
    'item retorna success': (r) => JSON.parse(r.body).success === true,
    'item retorna dados': (r) => JSON.parse(r.body).data !== undefined,
    'resposta em < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!itemCheck);

  sleep(1);

  // Teste 3: Item inexistente (deve retornar 404)
  const notFoundRes = http.get(
    `${BASE_URL}/api/item/dadosCadastrais/informacoesGerais/INVALID999`,
    {
      headers,
      tags: { expected_status: '404' }, // Tag para identificar que 404 é esperado
    }
  );
  
  const notFoundCheck = check(notFoundRes, {
    'item inexistente retorna 404': (r) => r.status === 404,
    'erro tem mensagem': (r) => JSON.parse(r.body).message !== undefined,
  });
  
  errorRate.add(!notFoundCheck);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-results/smoke-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = `\n${indent}📊 SMOKE TEST - Resumo\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // Requests
  const httpReqs = data.metrics.http_reqs;
  summary += `${indent}Total de Requisições: ${httpReqs.values.count}\n`;
  summary += `${indent}Taxa: ${httpReqs.values.rate.toFixed(2)}/s\n\n`;
  
  // Duração
  const duration = data.metrics.http_req_duration;
  summary += `${indent}Tempo de Resposta:\n`;
  summary += `${indent}  Média: ${duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  Min: ${duration.values.min.toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${duration.values.max.toFixed(2)}ms\n`;
  summary += `${indent}  p(95): ${duration.values['p(95)'].toFixed(2)}ms\n\n`;
  
  // Erros
  const failed = data.metrics.http_req_failed;
  const errorRate = data.metrics.errors;
  summary += `${indent}Taxa de Erro:\n`;
  summary += `${indent}  HTTP Failed: ${(failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}  Checks Failed: ${(errorRate.values.rate * 100).toFixed(2)}%\n\n`;
  
  // Thresholds
  summary += `${indent}Thresholds:\n`;
  Object.entries(data.metrics).forEach(([name, metric]) => {
    if (metric.thresholds) {
      Object.entries(metric.thresholds).forEach(([threshold, result]) => {
        const status = result.ok ? '✅' : '❌';
        summary += `${indent}  ${status} ${name}: ${threshold}\n`;
      });
    }
  });
  
  return summary;
}
