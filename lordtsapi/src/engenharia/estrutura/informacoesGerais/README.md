# Endpoint: Estrutura de Produtos (BOM) com Processos de Fabricação

## Visão Geral

Este endpoint retorna a estrutura completa de um produto (Bill of Materials - BOM) incluindo todos os componentes em formato de árvore recursiva, processos de fabricação associados a cada item, e um resumo consolidado de horas por centro de custo.

## Endpoints Disponíveis

### 1. Estrutura Completa

```
GET /api/engenharia/estrutura/informacoesGerais/:itemCodigo
```

Retorna a estrutura completa incluindo árvore de componentes, processos, operações e resumo de horas.

**Parâmetros:**
- `itemCodigo` (path, obrigatório): Código do item principal
- `dataReferencia` (query, opcional): Data de referência no formato YYYY-MM-DD para considerar vigências de componentes e operações

**Exemplo de Requisição:**
```bash
GET /api/engenharia/estrutura/informacoesGerais/7530110?dataReferencia=2025-01-15
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "itemPrincipal": {
      "codigo": "7530110",
      "estabelecimento": "01.01",
      "descricao": "RESISTÊNCIA 220V 5500W",
      "unidadeMedida": "UN",
      "nivel": 0,
      "quantidadeEstrutura": null,
      "quantidadeAcumulada": 1.0,
      "processoFabricacao": {
        "operacao": [
          {
            "codigo": 10,
            "descricao": "MONTAGEM",
            "estabelecimento": "01.01",
            "tempos": {
              "tempoHomemOriginal": 30.0,
              "tempoMaquinaOriginal": 0.0,
              "unidadeTempoCodigo": 2,
              "proporcao": 100.0,
              "horasHomemCalculadas": 0.5,
              "horasMaquinaCalculadas": 0.0
            },
            "centroCusto": {
              "codigo": "CC001",
              "descricao": "MONTAGEM MANUAL"
            },
            "grupoMaquina": {
              "codigo": "GM001",
              "descricao": "BANCADA MONTAGEM"
            },
            "recursos": {
              "nrUnidades": 1.0,
              "numeroHomem": 1.0,
              "unidadeMedida": "UN",
              "unidadeTempo": "m"
            }
          }
        ]
      },
      "componentes": [
        {
          "codigo": "7530111",
          "estabelecimento": "01.01",
          "descricao": "TERMINAIS",
          "unidadeMedida": "PC",
          "nivel": 1,
          "quantidadeEstrutura": 2.0,
          "quantidadeAcumulada": 2.0,
          "processoFabricacao": {
            "operacao": []
          },
          "componentes": []
        }
      ]
    },
    "resumoHoras": {
      "porCentroCusto": [
        {
          "estabelecimento": "01.01",
          "centroCusto": "CC001",
          "descricao": "MONTAGEM MANUAL",
          "totalHoras": 0.5,
          "horasHomem": 0.5,
          "horasMaquina": 0.0
        }
      ],
      "totais": {
        "totalGeralHoras": 0.5,
        "totalHorasHomem": 0.5,
        "totalHorasMaquina": 0.0
      }
    },
    "metadata": {
      "dataGeracao": "2025-01-21T10:30:00.000Z",
      "itemPesquisado": "7530110",
      "estabelecimentoPrincipal": "01.01",
      "totalNiveis": 2,
      "totalItens": 5,
      "totalOperacoes": 3
    }
  },
  "correlationId": "abc123-def456"
}
```

### 2. Resumo da Estrutura

```
GET /api/engenharia/estrutura/informacoesGerais/:itemCodigo/resumo
```

Retorna apenas metadata e resumo de horas, sem a árvore completa de componentes. Útil para dashboards e listagens.

**Parâmetros:**
- `itemCodigo` (path, obrigatório): Código do item
- `dataReferencia` (query, opcional): Data de referência (YYYY-MM-DD)

**Exemplo de Requisição:**
```bash
GET /api/engenharia/estrutura/informacoesGerais/7530110/resumo
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "resumoHoras": {
      "porCentroCusto": [...],
      "totais": {...}
    },
    "metadata": {...}
  },
  "correlationId": "abc123-def456"
}
```

## Estrutura de Dados

### ItemEstrutura (Recursivo)

Representa um item na estrutura, com seus componentes aninhados recursivamente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| codigo | string | Código do item |
| estabelecimento | string | Código do estabelecimento |
| descricao | string | Descrição do item |
| unidadeMedida | string | Unidade de medida |
| nivel | number | Nível na árvore (0 = raiz) |
| quantidadeEstrutura | number \| null | Quantidade na estrutura (null para raiz) |
| quantidadeAcumulada | number | Quantidade acumulada considerando toda a hierarquia |
| processoFabricacao | ProcessoFabricacao | Processos de fabricação deste item |
| componentes | ItemEstrutura[] | Array de componentes (recursivo) |

### ProcessoFabricacao

| Campo | Tipo | Descrição |
|-------|------|-----------|
| operacao | Operacao[] | Array de operações do processo |

### Operacao

| Campo | Tipo | Descrição |
|-------|------|-----------|
| codigo | number | Código da operação |
| descricao | string | Descrição da operação |
| estabelecimento | string | Código do estabelecimento |
| tempos | TemposOperacao | Tempos e cálculos da operação |
| centroCusto | CentroCusto | Centro de custo associado |
| grupoMaquina | GrupoMaquina | Grupo de máquina utilizado |
| recursos | RecursosOperacao | Recursos necessários |

### TemposOperacao

| Campo | Tipo | Descrição |
|-------|------|-----------|
| tempoHomemOriginal | number | Tempo homem cadastrado |
| tempoMaquinaOriginal | number | Tempo máquina cadastrado |
| unidadeTempoCodigo | number | 1=horas, 2=minutos, 3=segundos, 4=dias |
| proporcao | number | Proporção aplicada (%) |
| horasHomemCalculadas | number | Horas homem calculadas (já em horas) |
| horasMaquinaCalculadas | number | Horas máquina calculadas (já em horas) |

### ResumoHoras

| Campo | Tipo | Descrição |
|-------|------|-----------|
| porCentroCusto | ResumoHorasCentroCusto[] | Resumo por centro de custo |
| totais | TotaisHoras | Totais consolidados |

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Estrutura retornada com sucesso |
| 400 | Parâmetros inválidos (itemCodigo ou dataReferencia) |
| 404 | Item não encontrado ou sem estrutura definida |
| 500 | Erro interno do servidor |

## Validações

### itemCodigo
- Obrigatório
- Não pode ser vazio
- Deve ser uma string válida
- Validação contra SQL injection

### dataReferencia
- Opcional
- Formato obrigatório: YYYY-MM-DD (ISO 8601)
- Não pode ser anterior a 1900-01-01
- Não pode ser posterior a 10 anos no futuro

## Cache

O endpoint utiliza cache em camadas (L1 + L2):
- **L1**: Cache em memória (node-cache) - rápido mas por instância
- **L2**: Redis - compartilhado entre instâncias

O cache é gerenciado automaticamente pelo `DatabaseManager` e `QueryCacheService`.

## Stored Procedure

O endpoint utiliza a stored procedure SQL Server:
```sql
dbo.usp_ExplodeEstruturaEProcessos_JSON
```

**Parâmetros da SP:**
- `@ItemInicial`: Código do item
- `@DataReferencia`: Data de referência (opcional, padrão: GETDATE())
- `@LinkedServer`: Nome do linked server (configurável via env var `DB_LINKED_SERVER`)

## Configuração

### Variáveis de Ambiente

```env
# LinkedServer para consulta Datasul (opcional)
DB_LINKED_SERVER=TST_EMS2EMP  # Padrão se não configurado
```

## Exemplos de Uso

### cURL

```bash
# Estrutura completa
curl -X GET "http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110" \
  -H "Content-Type: application/json"

# Com data de referência
curl -X GET "http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110?dataReferencia=2025-01-15" \
  -H "Content-Type: application/json"

# Apenas resumo
curl -X GET "http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110/resumo" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript

```typescript
import axios from 'axios';

// Estrutura completa
const response = await axios.get(
  'http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110',
  {
    params: {
      dataReferencia: '2025-01-15'
    }
  }
);

console.log(response.data.data.metadata.totalItens);
console.log(response.data.data.resumoHoras.totais.totalGeralHoras);
```

## Troubleshooting

### Erro: "Stored procedure não encontrada"

Verifique se a stored procedure existe no banco:
```sql
SELECT * FROM sys.procedures
WHERE name = 'usp_ExplodeEstruturaEProcessos_JSON'
```

### Erro: "Item não encontrado"

- Verifique se o código do item está correto
- Verifique se o item existe no banco Datasul
- Verifique se o item possui estrutura cadastrada

### Erro: "Data de referência inválida"

- Use o formato YYYY-MM-DD (ex: 2025-01-15)
- Verifique se a data está dentro do range válido (1900 até 10 anos no futuro)

## Arquitetura

O endpoint segue a arquitetura em camadas do projeto:

```
Controller → Service → Repository
    ↓          ↓          ↓
  HTTP     Business    Database
  Layer     Logic      Access
```

**Arquivos:**
- `controller.ts`: Manipulação de requisições HTTP
- `service.ts`: Lógica de negócio e validações
- `repository.ts`: Acesso ao banco de dados
- `validators.ts`: Validações de entrada
- `types.ts`: Definições TypeScript
- `routes.ts`: Definição de rotas e documentação OpenAPI

## Testes

Execute os testes com:

```bash
# Todos os testes
npm run test

# Apenas testes desta feature
npm run test -- estrutura

# Com coverage
npm run test:coverage
```

## Documentação API

Acesse a documentação interativa Swagger em:
```
http://localhost:3000/api-docs
```

Procure pela tag **"Engenharia - Estrutura"**.
