// tests/load/spike.test.js
// Teste de Spike - Simula pico súbito de tráfego

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 10 },     // Tráfego normal
    { duration: '30s', target: 500 },   // SPIKE: pulo súbito para 500
    { duration: '3m', target: 500 },    // Mantém spike
    { duration: '30s', target: 10 },    // Retorna ao normal
    { duration: '1m', target: 10 },     // Recuperação
  ],
  
  thresholds: {
    http_req_duration: ['p(90)<3000'],  // Mais tolerante durante spike
    http_req_failed: ['rate<0.15'],     // Aceita 15% de falha no spike
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'admin-key-superuser';
const ITEM_CODES = ['7530110', '7530111', '7531112', '7530112']; // ← Adicione seus códigos aqui

export default function () {
  // Seleciona código aleatório
  const itemCode = ITEM_CODES[Math.floor(Math.random() * ITEM_CODES.length)];
  
  const res = http.get(
    `${BASE_URL}/api/lor0138/item/dadosCadastrais/informacoesGerais/${itemCode}`,
    {
      headers: { 
        'X-API-Key': API_KEY,
        'X-Correlation-ID': `k6-spike-${__VU}-${__ITER}` 
      },
      timeout: '10s',
    }
  );
  
  const success = check(res, {
    'status válido': (r) => [200, 404, 429, 503].includes(r.status),
    'responde': (r) => r.body !== undefined,
  });
  
  errorRate.add(!success);
  
  sleep(1);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const failed = data.metrics.http_req_failed;
  
  let summary = '\n⚡ SPIKE TEST - Pico Súbito de Tráfego\n';
  summary += '='.repeat(60) + '\n\n';
  summary += `Requisições: ${data.metrics.http_reqs.values.count}\n`;
  summary += `VUs Máx: ${data.metrics.vus.values.max}\n\n`;
  summary += `Resposta durante spike:\n`;
  summary += `  p(50): ${duration.values.med.toFixed(2)}ms\n`;
  summary += `  p(90): ${duration.values['p(90)'].toFixed(2)}ms\n`;
  summary += `  p(95): ${duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  Max: ${duration.values.max.toFixed(2)}ms\n\n`;
  summary += `Taxa de Falha: ${(failed.values.rate * 100).toFixed(2)}%\n\n`;
  
  // Análise de recuperação
  summary += 'Análise:\n';
  if (failed.values.rate < 0.1) {
    summary += '  ✅ API manteve-se estável durante spike\n';
  } else if (failed.values.rate < 0.2) {
    summary += '  ⚠️  API teve degradação durante spike\n';
  } else {
    summary += '  ❌ API não suportou o spike de tráfego\n';
  }
  
  return {
    'stdout': summary,
    'load-results/spike-summary.json': JSON.stringify(data, null, 2),
  };
}