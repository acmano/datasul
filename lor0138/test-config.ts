// test-config.ts - Script para validar configuração unificada
// Executar: npx ts-node -r tsconfig-paths/register test-config.ts

import { config, parseTimeout } from './src/config/env.config';
import { getSqlServerConfigEmp, getSqlServerConfigMult } from './src/infrastructure/database/config/sqlServerConfig';

console.log('\n' + '='.repeat(60));
console.log('🔍 VALIDAÇÃO DE CONFIGURAÇÃO UNIFICADA');
console.log('='.repeat(60) + '\n');

// ==================== TESTES DE PARSETIMEOUT ====================
console.log('📋 Testes de parseTimeout():\n');

const timeoutTests = [
  { input: '30s', expected: 30000, description: 'Segundos com "s"' },
  { input: '30000ms', expected: 30000, description: 'Milissegundos com "ms"' },
  { input: '30000', expected: 30000, description: 'Número puro' },
  { input: '5m', expected: 300000, description: 'Minutos com "m"' },
  { input: undefined, expected: 15000, description: 'Undefined (usa default)' },
];

timeoutTests.forEach(test => {
  const result = parseTimeout(test.input as any, 15000);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.description}: "${test.input}" → ${result}ms (esperado: ${test.expected}ms)`);
});

// ==================== CONFIGURAÇÃO GERAL ====================
console.log('\n' + '-'.repeat(60));
console.log('⚙️  Configuração Geral:\n');

console.log(`Servidor:
  - Porta: ${config.server.port}
  - Ambiente: ${config.server.nodeEnv}
  - Prefixo API: ${config.server.apiPrefix}`);

console.log(`\nBanco de Dados:
  - Tipo: ${config.database.type}
  - Mock Data: ${config.database.useMockData ? 'SIM ⚠️' : 'NÃO ✅'}`);

// ==================== SQL SERVER CONFIG ====================
console.log('\n' + '-'.repeat(60));
console.log('🗄️  Configuração SQL Server:\n');

const empConfig = getSqlServerConfigEmp();
const multConfig = getSqlServerConfigMult();

console.log(`EMP:
  - Server: ${empConfig.server}:${empConfig.port}
  - User: ${empConfig.user}
  - Password: ${empConfig.password ? '***' + empConfig.password.slice(-3) : 'VAZIO ❌'}
  - Database: ${empConfig.database || '(padrão do usuário) ✅'}
  - Connection Timeout: ${empConfig.connectionTimeout ?? 'não definido'}ms
  - Request Timeout: ${empConfig.requestTimeout ?? 'não definido'}ms`);

console.log(`\nMULT:
  - Server: ${multConfig.server}:${multConfig.port}
  - User: ${multConfig.user}
  - Database: ${multConfig.database || '(padrão do usuário) ✅'}
  - Connection Timeout: ${multConfig.connectionTimeout ?? 'não definido'}ms
  - Request Timeout: ${multConfig.requestTimeout ?? 'não definido'}ms`);

// ==================== TIMEOUTS ====================
console.log('\n' + '-'.repeat(60));
console.log('⏱️  Timeouts HTTP:\n');

console.log(`  - Request: ${config.timeout.request}ms`);
console.log(`  - Heavy Operation: ${config.timeout.heavyOperation}ms`);
console.log(`  - Health Check: ${config.timeout.healthCheck}ms`);

// ==================== CORS ====================
console.log('\n' + '-'.repeat(60));
console.log('🌐 CORS:\n');

console.log(`  Origens permitidas:`);
config.cors.allowedOrigins.forEach(origin => {
  console.log(`    - ${origin}`);
});

// ==================== CACHE ====================
console.log('\n' + '-'.repeat(60));
console.log('💾 Cache:\n');

console.log(`  - Habilitado: ${config.cache.enabled ? 'SIM ✅' : 'NÃO'}`);
console.log(`  - Estratégia: ${config.cache.strategy}`);
console.log(`  - Redis URL: ${config.cache.redis.url}`);
console.log(`  - TTL Padrão: ${config.cache.defaultTTL}ms`);

// ==================== VALIDAÇÕES ====================
console.log('\n' + '='.repeat(60));
console.log('🔍 VALIDAÇÕES:\n');

const validations = [];

// 1. Timeout não pode ser muito baixo
if (empConfig.connectionTimeout !== undefined && empConfig.connectionTimeout < 1000) {
  validations.push('❌ DB_CONNECTION_TIMEOUT muito baixo (< 1s). Provável erro de parsing!');
} else if (empConfig.connectionTimeout !== undefined) {
  validations.push('✅ DB_CONNECTION_TIMEOUT adequado');
} else {
  validations.push('⚠️  DB_CONNECTION_TIMEOUT não definido');
}

if (empConfig.requestTimeout !== undefined && empConfig.requestTimeout < 1000) {
  validations.push('❌ DB_REQUEST_TIMEOUT muito baixo (< 1s). Provável erro de parsing!');
} else if (empConfig.requestTimeout !== undefined) {
  validations.push('✅ DB_REQUEST_TIMEOUT adequado');
} else {
  validations.push('⚠️  DB_REQUEST_TIMEOUT não definido');
}

// 2. Senha não pode estar vazia
if (!empConfig.password) {
  validations.push('❌ DB_PASSWORD vazio!');
} else if (empConfig.password.includes('"')) {
  validations.push('⚠️  DB_PASSWORD contém aspas duplas (remova!)');
} else {
  validations.push('✅ DB_PASSWORD configurado');
}

// 3. Database pode estar vazio (é válido)
if (empConfig.database === '') {
  validations.push('✅ DB_DATABASE_EMP vazio (usa default do usuário)');
}

if (multConfig.database === '') {
  validations.push('✅ DB_DATABASE_MULT vazio (usa default do usuário)');
}

// 4. CORS deve ter pelo menos uma origem
if (config.cors.allowedOrigins.length === 0) {
  validations.push('⚠️  CORS_ALLOWED_ORIGINS vazio (nenhuma origem permitida)');
} else {
  validations.push('✅ CORS_ALLOWED_ORIGINS configurado');
}

validations.forEach(v => console.log(`  ${v}`));

// ==================== PROBLEMAS COMUNS ====================
console.log('\n' + '='.repeat(60));
console.log('🚨 VERIFICAÇÃO DE PROBLEMAS COMUNS:\n');

const issues = [];

// Verifica se está usando variáveis antigas
if (process.env.DB_NAME_EMP) {
  issues.push('⚠️  DB_NAME_EMP detectado no .env (USE DB_DATABASE_EMP)');
}

if (process.env.DB_NAME_MULT) {
  issues.push('⚠️  DB_NAME_MULT detectado no .env (USE DB_DATABASE_MULT)');
}

if (process.env.CORS_ORIGIN) {
  issues.push('⚠️  CORS_ORIGIN detectado no .env (USE CORS_ALLOWED_ORIGINS)');
}

// Verifica formato de timeout
if (process.env.DB_CONNECTION_TIMEOUT?.includes('s') && 
    empConfig.connectionTimeout !== undefined && 
    empConfig.connectionTimeout < 1000) {
  issues.push('❌ DB_CONNECTION_TIMEOUT com "s" mas valor < 1000ms (parseTimeout FALHOU!)');
}

if (issues.length === 0) {
  console.log('  ✅ Nenhum problema detectado!\n');
} else {
  issues.forEach(i => console.log(`  ${i}`));
  console.log();
}

// ==================== RESUMO ====================
console.log('='.repeat(60));
console.log('📊 RESUMO:\n');

const allOk = validations.every(v => v.startsWith('✅')) && issues.length === 0;

if (allOk) {
  console.log('  ✅ CONFIGURAÇÃO OK! Pronto para usar.\n');
} else {
  console.log('  ⚠️  Verifique os problemas acima antes de prosseguir.\n');
}

console.log('='.repeat(60) + '\n');