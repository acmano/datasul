// @ts-nocheck
// tests/load/stress.test.js
// Teste de Stress - Encontra o limite da API

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Aquecimento
    { duration: '5m', target: 100 },   // Carga normal
    { duration: '2m', target: 200 },   // Aumentando stress
    { duration: '5m', target: 300 },   // Alto stress
    { duration: '2m', target: 400 },   // Stress extremo
    { duration: '5m', target: 500 },   // Máximo stress
    { duration: '5m', target: 0 },     // Recovery
  ],
  
  thresholds: {
    http_req_duration: ['p(99)<5000'], // Aceita até 5s no p99 sob stress
    http_req_failed: ['rate<0.1'],     // Aceita até 10% de falha
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'admin-key-superuser';
const ITEM_CODES = ['7530110', '7531212', '7530111', '7530112']; // ← Adicione seus códigos aqui

export default function () {
  // Seleciona código aleatório
  const itemCode = ITEM_CODES[Math.floor(Math.random() * ITEM_CODES.length)];
  
  const res = http.get(
    `${BASE_URL}/api/lor0138/item/dadosCadastrais/informacoesGerais/${itemCode}`,
    {
      headers: { 
        'X-API-Key': API_KEY,
        'X-Correlation-ID': `k6-stress-${__VU}-${__ITER}` 
      },
    }
  );
  
  const success = check(res, {
    'status OK': (r) => [200, 404, 503].includes(r.status),
    'não timeout': (r) => r.timings.duration < 10000,
  });
  
  errorRate.add(!success);
  
  sleep(0.5);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const vus = data.metrics.vus;
  
  let summary = '\n💪 STRESS TEST - Teste de Limite\n';
  summary += '='.repeat(60) + '\n\n';
  summary += `VUs Máximo: ${vus.values.max}\n`;
  summary += `Requisições: ${data.metrics.http_reqs.values.count}\n`;
  summary += `Taxa Máx: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  summary += `p(95): ${duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `p(99): ${duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `Max: ${duration.values.max.toFixed(2)}ms\n\n`;
  summary += `Falhas: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  
  return {
    'stdout': summary,
    'load-results/stress-summary.json': JSON.stringify(data, null, 2),
  };
}