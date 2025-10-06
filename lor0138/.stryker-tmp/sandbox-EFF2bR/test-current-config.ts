// @ts-nocheck
// test-current-config.ts - Testar configuração ANTES da mudança
// Executar: npx ts-node -r tsconfig-paths/register test-current-config.ts

import { getSqlServerConfigEmp } from './src/infrastructure/database/config/sqlServerConfig';

console.log('\n' + '='.repeat(60));
console.log('🔍 TESTE DA CONFIGURAÇÃO ATUAL (ANTES DA MUDANÇA)');
console.log('='.repeat(60) + '\n');

const config = getSqlServerConfigEmp();

console.log('SQL Server Config EMP:');
console.log(`  Server: ${config.server}:${config.port}`);
console.log(`  User: ${config.user}`);
console.log(`  Password: ${config.password ? '***' + config.password.slice(-3) : 'VAZIO'}`);
console.log(`  Database: ${config.database || '(padrão do usuário)'}`);
console.log(`  Connection Timeout: ${config.connectionTimeout ?? 'não definido'}ms`);
console.log(`  Request Timeout: ${config.requestTimeout ?? 'não definido'}ms`);

console.log('\n' + '='.repeat(60));
console.log('📊 VALIDAÇÃO:\n');

const validations = [];

// Timeout deve ser >= 1000ms
if (config.connectionTimeout !== undefined && config.connectionTimeout >= 1000) {
  validations.push('✅ Connection Timeout OK (>= 1s)');
} else if (config.connectionTimeout !== undefined) {
  validations.push(`❌ Connection Timeout MUITO BAIXO: ${config.connectionTimeout}ms`);
} else {
  validations.push('⚠️  Connection Timeout não definido');
}

if (config.requestTimeout !== undefined && config.requestTimeout >= 1000) {
  validations.push('✅ Request Timeout OK (>= 1s)');
} else if (config.requestTimeout !== undefined) {
  validations.push(`❌ Request Timeout MUITO BAIXO: ${config.requestTimeout}ms`);
} else {
  validations.push('⚠️  Request Timeout não definido');
}

// Senha não pode estar vazia
if (config.password) {
  validations.push('✅ Password configurado');
} else {
  validations.push('❌ Password VAZIO');
}

// Database vazio é OK
if (config.database === '') {
  validations.push('✅ Database vazio (usa default do usuário)');
}

validations.forEach(v => console.log(`  ${v}`));

console.log('\n' + '='.repeat(60));

// Teste de parseInt com 's'
console.log('🧪 TESTE: Como parseInt() lida com "500s":\n');
const testValue = '500s';
const parsed = parseInt(testValue, 10);
console.log(`  parseInt('500s', 10) = ${parsed}`);
console.log(`  Esperado: 500000ms`);
console.log(`  Resultado: ${parsed}ms`);
console.log(`  Status: ${parsed === 500000 ? '✅ OK' : '❌ ERRO - parseInt ignora "s"'}`);

console.log('\n' + '='.repeat(60) + '\n');