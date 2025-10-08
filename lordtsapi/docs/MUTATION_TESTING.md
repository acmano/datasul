# Mutation Testing - Guia Completo

## O que é Mutation Testing?

Mutation Testing valida a **qualidade dos seus testes**, não do seu código. O Stryker cria pequenas modificações (mutações) no código de produção e verifica se seus testes detectam essas mudanças. Se um teste **não** detecta uma mutação, significa que o teste não é eficaz.

### Exemplo Prático

**Código Original:**
```typescript
if (itemCodigo.length > 16) {
  throw new ValidationError('Código muito longo');
}
```

**Mutação 1:** Stryker muda `>` para `>=`
```typescript
if (itemCodigo.length >= 16) { // MUTADO
  throw new ValidationError('Código muito longo');
}
```

**Mutação 2:** Stryker muda `16` para `17`
```typescript
if (itemCodigo.length > 17) { // MUTADO
  throw new ValidationError('Código muito longo');
}
```

Se seus testes **NÃO** pegam essas mutações, significa que você precisa de mais testes para validar os limites (boundary testing).

---

## Comandos Disponíveis

### Execução Completa (Todos os Arquivos)
```bash
npm run test:mutation
```
**Duração:** ~10-30 minutos dependendo do número de arquivos
**Uso:** Rodar antes de commits importantes ou releases

### Execução Rápida (Validators apenas)
```bash
npm run test:mutation:quick
```
**Duração:** ~2-5 minutos
**Uso:** Desenvolvimento diário, testar mudanças específicas

### Execução Incremental (Apenas Arquivos Modificados)
```bash
npm run test:mutation:incremental
```
**Duração:** ~1-10 minutos
**Uso:** Após mudanças no código, roda apenas nos arquivos alterados

### Dry Run (Sem Executar Testes)
```bash
npm run test:mutation:dry
```
**Duração:** ~30 segundos
**Uso:** Validar configuração antes de rodar mutation testing completo

### Execução + Abrir Relatório HTML
```bash
npm run test:mutation:html
```
**Uso:** Ver resultados visuais imediatamente após a execução

### Execução para CI/CD (Menos Concorrência)
```bash
npm run test:mutation:ci
```
**Uso:** Pipelines de integração contínua

### Ver Último Relatório
```bash
npm run mutation:report
```
**Uso:** Abrir relatório HTML da última execução

### Limpar Arquivos Temporários
```bash
npm run mutation:clean
```
**Uso:** Limpar cache e arquivos temporários do Stryker

---

## Interpretando os Resultados

### Status dos Mutantes

| Status | Descrição | O que significa |
|--------|-----------|-----------------|
| **Killed** ✅ | Mutante detectado pelos testes | **BOM** - Teste eficaz |
| **Survived** ❌ | Mutante não detectado | **RUIM** - Teste ineficaz ou faltando |
| **No Coverage** ⚠️ | Código sem cobertura de testes | **CRÍTICO** - Adicionar testes |
| **Timeout** ⏱️ | Testes demoraram muito | Possível loop infinito |
| **Compile Error** 🔧 | Mutação quebrou compilação | Mutação inválida (ignorar) |
| **Runtime Error** 💥 | Mutação causou erro em runtime | Mutação inválida (ignorar) |

### Mutation Score (Threshold)

```
Mutation Score = (Killed) / (Killed + Survived + No Coverage)
```

**Thresholds configurados:**
- **Alto:** 80% ✅ (Objetivo)
- **Baixo:** 60% ⚠️ (Mínimo aceitável)
- **Break:** 60% ❌ (Build falha se < 60%)

### Exemplo de Resultado

```
Mutant killed: 85
Mutant survived: 10
Mutant timeout: 2
Mutant no coverage: 3
Mutant compile error: 5

Mutation score: 85/98 = 86.73% ✅
```

**Interpretação:**
- 85 mutantes foram detectados pelos testes (bom!)
- 10 mutantes não foram detectados (precisa melhorar testes)
- 3 mutantes em código sem cobertura (adicionar testes)
- 5 mutações inválidas que quebraram compilação (ignorar)

---

## Relatório HTML

Após executar `npm run test:mutation`, abra:
```
reports/mutation/mutation-report.html
```

**O que você verá:**
1. **Resumo Geral:** Mutation score, total de mutantes
2. **Arquivos:** Lista de arquivos com score individual
3. **Mutantes:** Detalhes de cada mutação
4. **Diff Visual:** Mostra exatamente o que foi mutado

**Clique em um arquivo** para ver:
- Código original vs código mutado
- Qual teste deveria ter detectado
- Status do mutante (killed/survived)

---

## Tipos de Mutações

### Mutações Aritméticas
```typescript
// Original
const total = a + b;

// Mutações possíveis
const total = a - b;  // + → -
const total = a * b;  // + → *
const total = a / b;  // + → /
```

### Mutações Relacionais
```typescript
// Original
if (x > 10) { }

// Mutações possíveis
if (x >= 10) { }  // > → >=
if (x < 10) { }   // > → <
if (x == 10) { }  // > → ==
```

### Mutações Lógicas
```typescript
// Original
if (x && y) { }

// Mutações possíveis
if (x || y) { }  // && → ||
if (x) { }       // Remove y
if (y) { }       // Remove x
```

### Mutações de String
```typescript
// Original
if (name === 'admin') { }

// Mutações possíveis
if (name === '') { }        // String vazia
if (name === 'Stryker') { } // String diferente
```

### Mutações Booleanas
```typescript
// Original
const isValid = true;

// Mutações possíveis
const isValid = false;  // true → false
```

### Mutações de Bloco
```typescript
// Original
if (condition) {
  doSomething();
}

// Mutação possível
if (condition) {
  // Bloco removido
}
```

---

## Melhorando Mutation Score

### 1. Mutantes Sobreviventes em Validators

**Problema:** Mutante sobrevive em validação de tamanho
```typescript
// Código
if (itemCodigo.length > 16) {
  throw new ValidationError('Muito longo');
}

// Mutação: > → >=
if (itemCodigo.length >= 16) { // SOBREVIVEU
  throw new ValidationError('Muito longo');
}
```

**Solução:** Adicionar teste de boundary
```typescript
it('deve aceitar código com 16 caracteres', () => {
  const result = validate({ itemCodigo: '1234567890123456' }); // Exatos 16
  expect(result.valid).toBe(true);
});

it('deve rejeitar código com 17 caracteres', () => {
  const result = validate({ itemCodigo: '12345678901234567' }); // 17
  expect(result.valid).toBe(false);
});
```

### 2. Mutantes Sobreviventes em Lógica Condicional

**Problema:** Mutante sobrevive em cálculo de status
```typescript
// Código
const statusIndex = codObsoleto === 0 ? 1 : 2;

// Mutação: === → !==
const statusIndex = codObsoleto !== 0 ? 1 : 2; // SOBREVIVEU
```

**Solução:** Testar ambos os casos
```typescript
it('deve retornar statusIndex 1 quando codObsoleto é 0', () => {
  const result = service.getStatus({ codObsoleto: 0 });
  expect(result.statusIndex).toBe(1);
});

it('deve retornar statusIndex 2 quando codObsoleto não é 0', () => {
  const result = service.getStatus({ codObsoleto: 1 });
  expect(result.statusIndex).toBe(2);
});
```

### 3. Mutantes em Código Sem Cobertura

**Problema:** Código sem nenhum teste
```typescript
// Código
private sanitize(input: string): string {
  return input.trim().replace(/[<>]/g, ''); // SEM COBERTURA
}
```

**Solução:** Adicionar testes unitários
```typescript
describe('sanitize', () => {
  it('deve remover espaços', () => {
    expect(sanitize('  test  ')).toBe('test');
  });

  it('deve remover tags HTML', () => {
    expect(sanitize('<script>')).toBe('script');
  });
});
```

---

## Estratégia de Execução

### Durante Desenvolvimento
```bash
# 1. Desenvolva feature
# 2. Escreva testes unitários
npm run test

# 3. Valide cobertura
npm run test:coverage

# 4. Rode mutation testing rápido
npm run test:mutation:quick

# 5. Corrija mutantes sobreviventes
# 6. Repita 4-5 até atingir 80%+
```

### Antes de Commit/PR
```bash
# Execução completa
npm run test:mutation

# Verificar se passou threshold
# Se < 80%, adicionar mais testes
```

### CI/CD Pipeline
```yaml
# .github/workflows/mutation-testing.yml
- name: Mutation Testing
  run: npm run test:mutation:ci

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: mutation-report
    path: reports/mutation/
```

---

## Performance e Otimização

### Velocidade de Execução

**Fatores que afetam:**
- Número de arquivos mutados
- Número de testes
- Concorrência (CPUs disponíveis)

**Configurações de Performance:**

```json
{
  "concurrency": 4,              // 4 processos paralelos
  "maxConcurrentTestRunners": 4, // 4 test runners
  "coverageAnalysis": "perTest", // Mais rápido
  "timeoutMS": 60000,            // 60s timeout
  "timeoutFactor": 1.5           // 50% extra se teste demorar
}
```

### Reduzir Tempo de Execução

1. **Incremental Mode:** Roda apenas em arquivos modificados
```bash
npm run test:mutation:incremental
```

2. **Mutate Específico:** Foca em um módulo
```bash
stryker run --mutate 'src/api/**/validators/**/*.ts'
```

3. **Menos Concorrência:** Se máquina estiver lenta
```json
{
  "concurrency": 2
}
```

---

## Troubleshooting

### Erro: "Cannot find module"
**Causa:** Paths do TypeScript não resolvidos
**Solução:**
```json
// stryker.conf.json
{
  "tsconfigFile": "tsconfig.json"
}
```

### Erro: "Timeout"
**Causa:** Testes demorando muito
**Solução:**
```json
{
  "timeoutMS": 120000,  // Aumentar para 120s
  "timeoutFactor": 2.0
}
```

### Erro: "Out of Memory"
**Causa:** Muitos processos paralelos
**Solução:**
```json
{
  "concurrency": 2,  // Reduzir para 2
  "maxConcurrentTestRunners": 2
}
```

### Mutantes Falsos Positivos
**Causa:** Mutações que quebram TypeScript
**Solução:** São automaticamente marcados como "Compile Error" e ignorados

---

## Boas Práticas

### ✅ DO

1. **Rode mutation testing regularmente** (pelo menos antes de PRs)
2. **Foque em código crítico** (validators, services, business logic)
3. **Use incremental mode** durante desenvolvimento
4. **Analise mutantes sobreviventes** e adicione testes específicos
5. **Mantenha threshold >= 80%**

### ❌ DON'T

1. **Não ignore mutantes sobreviventes** sem análise
2. **Não rode mutation testing em todo código** (foque no crítico)
3. **Não adicione testes só para matar mutantes** sem valor real
4. **Não configure timeout muito baixo** (causa falsos positivos)
5. **Não rode mutation testing a cada save** (é lento)

---

## Métricas de Qualidade

### Mutation Score por Módulo

| Módulo | Target | Status |
|--------|--------|--------|
| Validators | 90%+ | 🎯 Crítico |
| Services | 85%+ | 🎯 Crítico |
| Repositories | 80%+ | ⚠️ Importante |
| Controllers | 75%+ | ✅ OK |
| Utils | 80%+ | ⚠️ Importante |

### Qualidade vs Cobertura

```
Cobertura 100% NÃO garante qualidade!

Exemplo:
- Cobertura: 100% ✅
- Mutation Score: 45% ❌

Conclusão: Testes executam código mas não validam resultados
```

---

## Integração com Coverage

### Pipeline Recomendado

```bash
# 1. Testes unitários
npm run test

# 2. Cobertura de código
npm run test:coverage

# 3. Mutation testing
npm run test:mutation

# 4. Testes de integração
npm run test:integration

# 5. Testes E2E
npm run test:e2e
```

### Métricas Combinadas

```
✅ Code Coverage: 85%
✅ Mutation Score: 82%
✅ Testes Passando: 100%

Status: PRONTO PARA PRODUÇÃO
```

---

## Próximos Passos

1. ✅ Instalação concluída
2. ✅ Configuração criada
3. 🔄 Executar primeira rodada: `npm run test:mutation:quick`
4. 📊 Analisar relatório HTML
5. 🎯 Corrigir mutantes sobreviventes
6. 🔁 Repetir até atingir 80%+
7. 🚀 Integrar no CI/CD

---

## Links Úteis

- [Stryker Mutator Docs](https://stryker-mutator.io/docs/)
- [Mutation Testing Handbook](https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/)
- [Jest Runner Config](https://stryker-mutator.io/docs/stryker-js/jest-runner/)

---

**Última atualização:** 2025-01-06
**Versão:** 1.0.0