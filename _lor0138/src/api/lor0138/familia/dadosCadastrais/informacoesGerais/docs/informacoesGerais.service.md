# Documentação - Service: Informações Gerais da Família

**Módulo:** `InformacoesGeraisService`
**Categoria:** Services
**Subcategoria:** Familia/DadosCadastrais
**Arquivo:** `src/api/lor0138/familia/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts`

---

## Visão Geral

Camada de lógica de negócio para operações relacionadas às informações gerais de famílias do sistema Datasul.

---

## Responsabilidades

O Service é responsável por:

- ✅ **Orquestrar** chamadas ao Repository
- ✅ **Transformar** dados brutos do banco em DTOs de resposta
- ✅ **Aplicar** regras de negócio
- ✅ **Tratar** e propagar erros de forma adequada
- ✅ **Registrar** eventos importantes (logging)

---

## Arquitetura

### Posicionamento na Camada

- **Camada intermediária** entre Controller e Repository
- **NÃO contém** lógica de validação (feita no Controller)
- **NÃO acessa** banco diretamente (usa Repository)
- **Converte** exceções técnicas em erros de domínio

### Fluxo de Dados

```
Controller → Service → Repository → Database
    ↓          ↓          ↓            ↓
Validação  Negócio   Query SQL    Datasul
```

---

## Padrões de Projeto

### Service Layer Pattern

O Service implementa o padrão **Service Layer**, atuando como:
- Fachada para operações de negócio
- Orquestrador de múltiplas operações
- Conversor entre camadas

### Transaction Script Pattern

- Métodos **estáticos** (stateless)
- Cada método é uma transação de negócio completa
- Sem manutenção de estado entre chamadas

### Características

| Característica | Implementação |
|----------------|---------------|
| **Estado** | Stateless (sem estado) |
| **Métodos** | Estáticos |
| **Dependências** | Repository, Logger, CustomErrors |
| **Acesso a Dados** | Via Repository (nunca direto) |

---

## Classe: InformacoesGeraisService

### Estrutura

```typescript
export class InformacoesGeraisService {
  static async getInformacoesGerais(
    familiaCodigo: string
  ): Promise<any | null>
}
```

---

## Método: getInformacoesGerais

### Descrição

Busca informações completas de uma família, incluindo dados mestres da tabela `pub.familia` do sistema Datasul.

### Assinatura

```typescript
static async getInformacoesGerais(
  familiaCodigo: string
): Promise<any | null>
```

### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `familiaCodigo` | `string` | Código único da família no sistema Datasul |

### Retorno

**Tipo:** `Promise<FamiliaInformacoesGerais>`

**Estrutura do DTO:**

```typescript
{
  identificacaoFamiliaCodigo: string;
  identificacaoFamiliaDescricao: string;
}
```

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `identificacaoFamiliaCodigo` | `string` | Código da família |
| `identificacaoFamiliaDescricao` | `string` | Descrição completa da família |

---

## Fluxo de Execução

### Etapas do Método

```
1. Buscar Dados Mestres
   ↓
2. Verificar Existência
   ↓
3. Montar DTO de Resposta
   ↓
4. Retornar Resposta
```

### Detalhamento das Etapas

#### Etapa 1: Buscar Dados Mestres da Família

```typescript
const familiaData = await FamiliaInformacoesGeraisRepository.getFamiliaMaster(familiaCodigo);
```

- **Origem:** Tabela `pub.familia` via `OPENQUERY`
- **Retorna:** `familiaCodigo`, `familiaDescricao`
- **Comportamento:** Retorna `null` se família não existir

#### Etapa 2: Verificar Existência da Família

```typescript
if (!familiaData) {
  log.info('Família não encontrada', { familiaCodigo });
  throw new FamiliaNotFoundError(familiaCodigo);
}
```

- **Early Return:** Não busca outros dados se família não existir
- **Logging:** Registra tentativa de acesso a família inexistente
- **Erro:** Lança `FamiliaNotFoundError` (404)

#### Etapa 3: Montar DTO de Resposta

```typescript
const response = {
  identificacaoFamiliaCodigo: familiaData.familiaCodigo,
  identificacaoFamiliaDescricao: familiaData.familiaDescricao,
};
```

- **Transformação:** Dados brutos → Formato padronizado
- **Aplicação:** Regras de negócio no mapeamento

#### Etapa 4: Retornar Resposta

```typescript
return response;
```

- **Tipo:** DTO completo pronto para o Controller

---

## Tratamento de Erros

### Estratégia de Erros

O Service implementa tratamento de erros em **duas camadas**:

1. **Re-lançamento** de erros de domínio conhecidos
2. **Conversão** de erros técnicos em erros de domínio

### Caso 1: Família Não Encontrada

```typescript
if (error instanceof FamiliaNotFoundError) {
  throw error;
}
```

**Comportamento:**
- Re-lança sem alteração
- Preserva `statusCode 404`
- Mantém mensagem original

**Quando ocorre:**
- Família não existe no banco
- `getFamiliaMaster()` retorna `null`

### Caso 2: Erro de Banco de Dados

```typescript
log.error('Erro ao buscar informações gerais', {
  familiaCodigo,
  error: error instanceof Error ? error.message : 'Erro desconhecido',
});

throw new DatabaseError(
  'Falha ao buscar informações da família',
  error instanceof Error ? error : undefined
);
```

**Comportamento:**
- Converte para `DatabaseError`
- Adiciona contexto (`familiaCodigo`)
- Preserva erro original como causa
- Registra erro detalhado no log

**Quando ocorre:**
- Timeout de conexão
- Conexão perdida
- SQL inválido
- Erro de rede
- Qualquer erro técnico

---

## Exceções Lançadas

### FamiliaNotFoundError

**Tipo:** Erro de Domínio
**Status Code:** `404`

**Quando:**
- Família não existe no banco de dados
- `getFamiliaMaster()` retorna `null/undefined`

**Estrutura:**
```typescript
{
  name: 'FamiliaNotFoundError',
  message: 'Família {familiaCodigo} não encontrado',
  statusCode: 404
}
```

### DatabaseError

**Tipo:** Erro Técnico
**Status Code:** `500`

**Quando:**
- Timeout de conexão
- Conexão perdida
- SQL inválido
- Erro de rede
- Outros erros técnicos

**Estrutura:**
```typescript
{
  name: 'DatabaseError',
  message: 'Falha ao buscar informações da família',
  statusCode: 500,
  cause: Error // Erro original
}
```

---

## Exemplos de Uso

### Exemplo 1: Caso de Sucesso

```typescript
const result = await InformacoesGeraisService.getInformacoesGerais('450000');

// Retorno:
{
  identificacaoFamiliaCodigo: '450000',
  identificacaoFamiliaDescricao: 'FAMÍLIA TESTE'
}
```

### Exemplo 2: Família Não Encontrada

```typescript
try {
  await InformacoesGeraisService.getInformacoesGerais('INVALID');
} catch (error) {
  console.log(error.name);        // 'FamiliaNotFoundError'
  console.log(error.message);     // 'Família INVALID não encontrado'
  console.log(error.statusCode);  // 404
}
```

### Exemplo 3: Erro de Banco de Dados

```typescript
try {
  await InformacoesGeraisService.getInformacoesGerais('450000');
} catch (error) {
  console.log(error.name);        // 'DatabaseError'
  console.log(error.message);     // 'Falha ao buscar informações da família'
  console.log(error.statusCode);  // 500
  console.log(error.cause);       // Erro original do banco
}
```

### Exemplo 4: Uso no Controller

```typescript
// No controller
async getFamiliaInformacoesGerais(req: Request, res: Response) {
  try {
    const { familiaCodigo } = req.params;

    // Service retorna dados ou lança erro
    const data = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    // Middleware errorHandler trata os erros
    next(error);
  }
}
```

---

## Regras de Negócio

### Verificação de Existência

- **Regra:** Família deve existir antes de buscar outros dados
- **Implementação:** Early return se `familiaData` for `null`
- **Benefício:** Evita queries desnecessárias

### Mapeamento de Dados

- **Regra:** Padronização de nomenclatura
- **Implementação:** Prefixo `identificacao` nos campos mestres
- **Benefício:** Consistência na API

---

## Pontos Críticos

### Logging

**Família Não Encontrada:**
```typescript
log.info('Família não encontrada', { familiaCodigo });
```
- **Nível:** INFO (não é erro de sistema)
- **Contexto:** Inclui `familiaCodigo` para rastreabilidade

**Erro de Banco:**
```typescript
log.error('Erro ao buscar informações gerais', {
  familiaCodigo,
  error: error instanceof Error ? error.message : 'Erro desconhecido',
});
```
- **Nível:** ERROR (erro de sistema)
- **Contexto:** Inclui `familiaCodigo` e mensagem de erro

### Preservação de Stack Trace

```typescript
throw new DatabaseError(
  'Falha ao buscar informações da família',
  error instanceof Error ? error : undefined // Preserva erro original
);
```

**Benefícios:**
- Debug facilitado
- Rastreamento completo do erro
- Informações técnicas preservadas

---

## Dependências

### Internas

| Dependência | Tipo | Uso |
|-------------|------|-----|
| `FamiliaInformacoesGeraisRepository` | Repository | Acesso aos dados |
| `FamiliaNotFoundError` | Custom Error | Erro de domínio (404) |
| `DatabaseError` | Custom Error | Erro técnico (500) |
| `log` | Logger | Registro de eventos |

### Externas

Nenhuma dependência externa direta.

---

## Boas Práticas Implementadas

### ✅ Single Responsibility

Cada método tem uma única responsabilidade clara.

### ✅ Separation of Concerns

- Service não valida entrada (Controller faz)
- Service não acessa banco direto (Repository faz)
- Service foca em lógica de negócio

### ✅ Error Handling

- Erros específicos para cada situação
- Preservação de stack trace
- Contexto adequado em logs

### ✅ Stateless Design

- Métodos estáticos
- Sem estado compartilhado
- Thread-safe por design

### ✅ Logging Apropriado

- INFO para eventos de negócio
- ERROR para falhas técnicas
- Contexto suficiente para debug

---

## Manutenção

### Adicionando Novas Regras de Negócio

1. Adicione a lógica após buscar os dados
2. Aplique transformações necessárias
3. Documente a regra neste arquivo
4. Adicione testes unitários

### Modificando Mapeamento de Dados

1. Atualize a estrutura do `response`
2. Atualize o tipo de retorno
3. Atualize a documentação do DTO
4. Verifique impacto no Controller

### Tratando Novos Tipos de Erro

1. Crie custom error específico (se necessário)
2. Adicione caso no bloco catch
3. Defina status code apropriado
4. Documente o novo erro

---

## Referências

### Veja Também

- `FamiliaInformacoesGeraisRepository.getFamiliaMaster()` - Busca dados mestres
- `FamiliaNotFoundError` - Erro de família não encontrada
- `DatabaseError` - Erro de banco de dados
- `informacoesGerais.types.ts` - DTOs e interfaces

### Padrões de Projeto

- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Transaction Script Pattern](https://martinfowler.com/eaaCatalog/transactionScript.html)

---

## Observações Técnicas

### Performance

- **Early Return:** Evita queries desnecessárias quando família não existe
- **Single Query:** Busca apenas dados mestres (otimizado)

### Escalabilidade

- **Stateless:** Suporta múltiplas instâncias
- **Sem Cache:** Dados sempre atualizados (considerar cache futuro)

### Segurança

- **Validação no Controller:** Service assume dados já validados
- **Sanitização prévia:** Códigos já sanitizados antes de chegar aqui
- **Logging seguro:** Não loga dados sensíveis