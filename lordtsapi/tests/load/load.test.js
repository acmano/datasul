// tests/load/load.test.js
// Teste de Carga - Simula aumento gradual de usuários

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const itemDuration = new Trend('item_duration');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Aquecimento: 10 usuários por 2min
    { duration: '5m', target: 50 },   // Carga normal: 50 usuários por 5min
    { duration: '2m', target: 100 },  // Pico: 100 usuários por 2min
    { duration: '5m', target: 50 },   // Redução: volta para 50 por 5min
    { duration: '2m', target: 0 },    // Cooldown: reduz para 0
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    http_req_failed: ['rate<0.05'], // Taxa de erro < 5%
    errors: ['rate<0.05'],
    item_duration: ['p(95)<800'], // Endpoint específico < 800ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'admin-key-superuser'; // API Key de admin
const ITEM_CODES = ['7530110', '7531212', '7530111', '7530112']; // Diferentes códigos para variar

export default function () {
  // Seleciona código aleatório
  const itemCode = ITEM_CODES[Math.floor(Math.random() * ITEM_CODES.length)];
  
  const startTime = new Date();
  
  const res = http.get(
    `${BASE_URL}/api/item/dadosCadastrais/informacoesGerais/${itemCode}`,
    {
      headers: {
        'X-API-Key': API_KEY,
        'X-Correlation-ID': `k6-load-${__VU}-${__ITER}`,
      },
    }
  );
  
  const duration = new Date() - startTime;
  itemDuration.add(duration);
  
  const success = check(res, {
    'status é 200 ou 404': (r) => [200, 404].includes(r.status),
    'resposta tem body': (r) => r.body.length > 0,
    'tempo de resposta OK': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  
  sleep(Math.random() * 3 + 1); // Pausa entre 1-4 segundos
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'load-results/load-summary.json': JSON.stringify(data, null, 2),
    'load-results/load-summary.html': htmlReport(data),
  };
}

function textSummary(data) {
  let summary = '\n📈 LOAD TEST - Resumo de Carga Progressiva\n';
  summary += '='.repeat(60) + '\n\n';
  
  const httpReqs = data.metrics.http_reqs;
  const duration = data.metrics.http_req_duration;
  const failed = data.metrics.http_req_failed;
  
  summary += `Total de Requisições: ${httpReqs.values.count}\n`;
  summary += `Taxa Média: ${httpReqs.values.rate.toFixed(2)}/s\n`;
  summary += `Duração Total: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(1)} minutos\n\n`;
  
  summary += 'Tempo de Resposta:\n';
  summary += `  Média: ${duration.values.avg.toFixed(2)}ms\n`;
  summary += `  Mediana: ${duration.values.med.toFixed(2)}ms\n`;
  summary += `  p(95): ${duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  p(99): ${duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `  Max: ${duration.values.max.toFixed(2)}ms\n\n`;
  
  summary += 'Taxa de Falhas:\n';
  summary += `  HTTP Failed: ${(failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `  Checks Failed: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;
  
  summary += 'Status dos Thresholds:\n';
  Object.entries(data.metrics).forEach(([name, metric]) => {
    if (metric.thresholds) {
      Object.entries(metric.thresholds).forEach(([threshold, result]) => {
        const status = result.ok ? '✅ PASS' : '❌ FAIL';
        summary += `  ${status}: ${name} ${threshold}\n`;
      });
    }
  });
  
  return summary;
}

function htmlReport(data) {
  const duration = data.metrics.http_req_duration;
  const failed = data.metrics.http_req_failed;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report - LOR0138</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .metric { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
    .metric h3 { margin-top: 0; color: #007bff; }
    .value { font-size: 24px; font-weight: bold; color: #333; }
    .threshold { padding: 8px; margin: 5px 0; border-radius: 4px; }
    .pass { background: #d4edda; color: #155724; }
    .fail { background: #f8d7da; color: #721c24; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📈 Load Test Report - API LOR0138</h1>
    <p><strong>Duração:</strong> ${(data.state.testRunDurationMs / 1000 / 60).toFixed(1)} minutos</p>
    
    <div class="metric">
      <h3>Requisições</h3>
      <div class="value">${data.metrics.http_reqs.values.count}</div>
      <p>Taxa: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s</p>
    </div>
    
    <div class="metric">
      <h3>Tempo de Resposta</h3>
      <table>
        <tr><th>Métrica</th><th>Valor</th></tr>
        <tr><td>Média</td><td>${duration.values.avg.toFixed(2)}ms</td></tr>
        <tr><td>Mediana</td><td>${duration.values.med.toFixed(2)}ms</td></tr>
        <tr><td>p(95)</td><td>${duration.values['p(95)'].toFixed(2)}ms</td></tr>
        <tr><td>p(99)</td><td>${duration.values['p(99)'].toFixed(2)}ms</td></tr>
        <tr><td>Máximo</td><td>${duration.values.max.toFixed(2)}ms</td></tr>
      </table>
    </div>
    
    <div class="metric">
      <h3>Taxa de Falhas</h3>
      <p>HTTP Failed: <strong>${(failed.values.rate * 100).toFixed(2)}%</strong></p>
      <p>Checks Failed: <strong>${(data.metrics.errors.values.rate * 100).toFixed(2)}%</strong></p>
    </div>
    
    <div class="metric">
      <h3>Thresholds</h3>
      ${Object.entries(data.metrics)
        .filter(([_, metric]) => metric.thresholds)
        .map(([name, metric]) => 
          Object.entries(metric.thresholds)
            .map(([threshold, result]) => 
              `<div class="threshold ${result.ok ? 'pass' : 'fail'}">
                ${result.ok ? '✅' : '❌'} ${name}: ${threshold}
              </div>`
            ).join('')
        ).join('')}
    </div>
  </div>
</body>
</html>
  `;
}
