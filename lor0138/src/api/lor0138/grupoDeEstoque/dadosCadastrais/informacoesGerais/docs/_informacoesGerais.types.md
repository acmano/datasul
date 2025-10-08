# Documentação - Types: Informações Gerais de Famílias

**Módulo:** `InformacoesGeraisTypes`
**Categoria:** Types
**Arquivo:** `src/api/lor0138/familia/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts`

---

## Visão Geral

Define os contratos de dados para o módulo de informações gerais, incluindo:

- **DTOs de Request/Response** (camada de API)
- **Modelos de domínio** (representação de negócio)
- **Tipos de resultado de queries** (camada de dados)

---

## Arquitetura de Tipos

```
Request → RequestDTO → Service → Repository → QueryResult
                          ↓
                      DomainModel
                          ↓
                     ResponseDTO → Response
```

---

## Convenção de Nomenclatura

| Sufixo/Padrão | Descrição | Uso |
|---------------|-----------|-----|
| `*RequestDTO` | Dados de entrada da API | Validação e recebimento de requisições |
| `*ResponseDTO` | Dados de saída da API | Envelope de resposta HTTP |
| `*QueryResult` | Resultado bruto de queries SQL | Retorno direto do banco de dados |
| Sem sufixo | Modelos de domínio | Business objects da aplicação |

---

## Interfaces e Tipos

### 1. FamiliaInformacoesGerais

**Tipo:** Modelo de Domínio

Representa os dados de uma família específica.

#### Origem dos Dados

- **Progress/Datasul:** Tabela `familia`
- **SQL Server:** Linked Server `PRD_EMS2EMP`

#### Propriedades

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `familiaCodigo` | `string` | Código da família no ERP (chave primária) |
| `familiaDescricao` | `string` | Descrição completa da família |

---

### 2. FamiliaInformacoesGeraisRequestDTO

**Tipo:** DTO de Request

Define o contrato de dados esperado na requisição HTTP. Usado pelo validator para validação de entrada.

#### Validações Aplicadas

- `familiaCodigo` é obrigatório
- `familiaCodigo` é string
- `familiaCodigo` tem 1-16 caracteres
- `familiaCodigo` contém apenas A-Z, a-z, 0-9
- Sanitização contra SQL injection/XSS

#### Propriedades

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `familiaCodigo` | `string` | Código da família a ser buscada (1-16 caracteres alfanuméricos). Será validado e sanitizado antes de uso. |

#### Exemplo de Uso

```typescript
// Vem de req.params no controller
const request: FamiliaInformacoesGeraisRequestDTO = {
  familiaCodigo: '450000'
};
```

#### Referências

Veja `validateFamiliaInformacoesGeraisRequest` para validação completa.

---

### 3. FamiliaInformacoesGeraisResponseDTO

**Tipo:** DTO de Response

Envelope padrão para respostas HTTP do endpoint. Segue o padrão de resposta da API com flag de sucesso.

#### Estrutura de Resposta

- **Sucesso:** `{ success: true, data: {...} }`
- **Erro:** `{ success: false, error: '...' }`

#### Propriedades

| Propriedade | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `success` | `boolean` | Sim | Indica se operação foi bem-sucedida |
| `data` | `FamiliaInformacoesGerais` | Não | Dados da família (presente se success = true) |
| `error` | `string` | Não | Mensagem de erro (presente se success = false) |

#### Exemplos de Uso

**Resposta de Sucesso:**

```typescript
const response: FamiliaInformacoesGeraisResponseDTO = {
  success: true,
  data: {
    familiaCodigo: '450000',
    familiaDescricao: 'FAMILIA TESTE'
  }
};
```

**Resposta de Erro:**

```typescript
const errorResponse: FamiliaInformacoesGeraisResponseDTO = {
  success: false,
  error: 'Família não encontrada'
};
```

#### Observações

Este tipo é usado pelo controller, mas o middleware `errorHandler` pode modificar a estrutura em caso de erro.

---

### 4. FamiliaMasterQueryResult

**Tipo:** Query Result (Camada de Dados)
**Visibilidade:** Private (uso interno do Repository)

Representa a estrutura de dados retornada diretamente pela query do SQL Server/Linked Server, antes de qualquer transformação.

#### Origem SQL

```sql
SELECT
  familia."fm-codigo" as familiaCodigo,
  familia."descricao" as familiaDescricao
FROM OPENQUERY (
  PRD_EMS2EMP
, 'SELECT  "fm-codigo"
          , "desc-item"
          , "un"
      FROM  pub.familia familia
      WHERE "fm-codigo" = ''${familiaCodigo}''
   ') as familia
```

#### Fluxo de Transformação

```
QueryResult → (Repository) → DomainModel → (Service) → ResponseDTO
```

#### Propriedades

| Propriedade | Tipo | Coluna SQL | Descrição |
|-------------|------|------------|-----------|
| `familiaCodigo` | `string` | `fm-codigo` | Código da família |
| `familiaDescricao` | `string` | `descricao` | Descrição da família |

#### Exemplo de Uso

```typescript
// Retornado pelo DatabaseManager após query
const queryResult: FamiliaMasterQueryResult = {
  familiaCodigo: '450000',
  familiaDescricao: 'FAMILIA TESTE'
};
```

---

## Fluxo de Dados Completo

1. **Requisição HTTP** chega com `FamiliaInformacoesGeraisRequestDTO`
2. **Validação** do DTO de request
3. **Service** processa a requisição
4. **Repository** executa query SQL
5. **Query retorna** `FamiliaMasterQueryResult`
6. **Repository** transforma em `FamiliaInformacoesGerais` (modelo de domínio)
7. **Service** retorna modelo de domínio
8. **Controller** empacota em `FamiliaInformacoesGeraisResponseDTO`
9. **Resposta HTTP** enviada ao cliente

---

## Segurança e Validação

### Validações de Entrada

- Campo obrigatório
- Tipo string
- Comprimento: 1-16 caracteres
- Padrão: apenas caracteres alfanuméricos (A-Z, a-z, 0-9)
- Sanitização contra SQL injection
- Sanitização contra XSS

### Proteção de Dados

- Uso de Linked Server para acesso ao Progress/Datasul
- Queries parametrizadas para prevenir SQL injection
- Validação rigorosa antes de acesso ao banco

---

## Notas Técnicas

- Todos os tipos são interfaces TypeScript (não classes)
- Imutabilidade recomendada para DTOs
- Query results são privados ao repository layer
- Separação clara entre camadas (API, Domain, Data)