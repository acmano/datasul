# Exemplos de Uso - Estrutura de Produtos (BOM)

## Requisitos

1. **Stored Procedure**: A SP `usp_ExplodeEstruturaEProcessos_JSON` deve estar criada no banco
   - Execute o script: `database/create_stored_procedure.sql`

2. **Configuração**: Configure o LinkedServer no `.env` (opcional)
   ```env
   DB_LINKED_SERVER=TST_EMS2EMP
   ```

3. **Servidor**: Inicie o servidor da API
   ```bash
   npm run dev
   ```

## Exemplo 1: Buscar Estrutura Completa

### Request
```bash
curl -X GET "http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110" \
  -H "Content-Type: application/json"
```

### Response (resumida)
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
      "quantidadeAcumulada": 1,
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
      "dataGeracao": "2025-01-21T13:45:30.123Z",
      "itemPesquisado": "7530110",
      "estabelecimentoPrincipal": "01.01",
      "totalNiveis": 2,
      "totalItens": 5,
      "totalOperacoes": 3
    }
  },
  "correlationId": "abc-123-def-456"
}
```

## Exemplo 2: Buscar com Data de Referência

Busca a estrutura considerando vigências até uma data específica.

### Request
```bash
curl -X GET "http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110?dataReferencia=2024-12-31" \
  -H "Content-Type: application/json"
```

Isso retornará apenas componentes e operações que estavam vigentes em 31/12/2024.

## Exemplo 3: Buscar Apenas Resumo

Para dashboards e relatórios que não precisam da árvore completa.

### Request
```bash
curl -X GET "http://localhost:3000/api/engenharia/estrutura/informacoesGerais/7530110/resumo" \
  -H "Content-Type: application/json"
```

### Response
```json
{
  "success": true,
  "data": {
    "resumoHoras": {
      "porCentroCusto": [
        {
          "estabelecimento": "01.01",
          "centroCusto": "CC001",
          "descricao": "MONTAGEM MANUAL",
          "totalHoras": 0.5,
          "horasHomem": 0.5,
          "horasMaquina": 0.0
        },
        {
          "estabelecimento": "01.01",
          "centroCusto": "CC002",
          "descricao": "USINAGEM",
          "totalHoras": 2.5,
          "horasHomem": 1.0,
          "horasMaquina": 1.5
        }
      ],
      "totais": {
        "totalGeralHoras": 3.0,
        "totalHorasHomem": 1.5,
        "totalHorasMaquina": 1.5
      }
    },
    "metadata": {
      "dataGeracao": "2025-01-21T13:45:30.123Z",
      "itemPesquisado": "7530110",
      "estabelecimentoPrincipal": "01.01",
      "totalNiveis": 3,
      "totalItens": 15,
      "totalOperacoes": 8
    }
  },
  "correlationId": "xyz-789"
}
```

## Exemplo 4: Usando JavaScript/TypeScript

### Com fetch (browser)
```javascript
async function buscarEstrutura(itemCodigo, dataReferencia = null) {
  const url = new URL(`http://localhost:3000/api/engenharia/estrutura/informacoesGerais/${itemCodigo}`);

  if (dataReferencia) {
    url.searchParams.append('dataReferencia', dataReferencia);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    console.log('Total de itens:', data.data.metadata.totalItens);
    console.log('Total de horas:', data.data.resumoHoras.totais.totalGeralHoras);
    return data.data;
  } else {
    throw new Error(data.error || 'Erro ao buscar estrutura');
  }
}

// Uso
buscarEstrutura('7530110', '2025-01-15')
  .then(estrutura => {
    console.log('Estrutura carregada:', estrutura);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```

### Com axios (Node.js)
```typescript
import axios from 'axios';
import type { EstruturaCompleta } from './types';

async function buscarEstrutura(
  itemCodigo: string,
  dataReferencia?: string
): Promise<EstruturaCompleta> {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/engenharia/estrutura/informacoesGerais/${itemCodigo}`,
      {
        params: { dataReferencia }
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Erro desconhecido');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro na requisição:', error.response?.data);
      throw new Error(error.response?.data?.error || error.message);
    }
    throw error;
  }
}

// Uso
const estrutura = await buscarEstrutura('7530110', '2025-01-15');

console.log('Item:', estrutura.itemPrincipal.codigo);
console.log('Descrição:', estrutura.itemPrincipal.descricao);
console.log('Nº de componentes:', estrutura.itemPrincipal.componentes.length);
console.log('Total de horas:', estrutura.resumoHoras.totais.totalGeralHoras);

// Percorrer árvore recursivamente
function imprimirArvore(item: ItemEstrutura, indent = 0) {
  const espacos = '  '.repeat(indent);
  console.log(`${espacos}${item.codigo} - ${item.descricao} (Qtd: ${item.quantidadeAcumulada})`);

  item.componentes.forEach(comp => {
    imprimirArvore(comp, indent + 1);
  });
}

imprimirArvore(estrutura.itemPrincipal);
```

## Exemplo 5: Analisar Horas por Centro de Custo

```javascript
async function analisarHoras(itemCodigo) {
  const response = await fetch(
    `http://localhost:3000/api/engenharia/estrutura/informacoesGerais/${itemCodigo}/resumo`
  );
  const data = await response.json();

  if (data.success) {
    const { resumoHoras } = data.data;

    console.log('=== RESUMO DE HORAS ===');
    console.log(`Total Geral: ${resumoHoras.totais.totalGeralHoras.toFixed(2)}h`);
    console.log(`  - Homem: ${resumoHoras.totais.totalHorasHomem.toFixed(2)}h`);
    console.log(`  - Máquina: ${resumoHoras.totais.totalHorasMaquina.toFixed(2)}h`);
    console.log('');
    console.log('Por Centro de Custo:');

    resumoHoras.porCentroCusto.forEach(cc => {
      console.log(`  ${cc.centroCusto} - ${cc.descricao}`);
      console.log(`    Total: ${cc.totalHoras.toFixed(2)}h`);
      console.log(`    Homem: ${cc.horasHomem.toFixed(2)}h`);
      console.log(`    Máquina: ${cc.horasMaquina.toFixed(2)}h`);
    });
  }
}

analisarHoras('7530110');
```

## Exemplo 6: Tratamento de Erros

```typescript
async function buscarEstruturaSegura(itemCodigo: string) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/engenharia/estrutura/informacoesGerais/${itemCodigo}`
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Item ${itemCodigo} não encontrado ou sem estrutura`);
      } else if (response.status === 400) {
        console.error('Parâmetros inválidos:', data.error);
      } else {
        console.error('Erro no servidor:', data.error);
      }
      throw new Error(data.error);
    }

    return data.data;

  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Erro de rede ou servidor indisponível');
    }
    throw error;
  }
}
```

## Exemplo 7: Calcular Custo Total

```typescript
interface CustoHora {
  homem: number;
  maquina: number;
}

async function calcularCustoTotal(
  itemCodigo: string,
  custosPorCC: Map<string, CustoHora>
): Promise<number> {
  const response = await fetch(
    `http://localhost:3000/api/engenharia/estrutura/informacoesGerais/${itemCodigo}/resumo`
  );
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  let custoTotal = 0;

  data.data.resumoHoras.porCentroCusto.forEach((cc: any) => {
    const custos = custosPorCC.get(cc.centroCusto);
    if (custos) {
      custoTotal += cc.horasHomem * custos.homem;
      custoTotal += cc.horasMaquina * custos.maquina;
    }
  });

  return custoTotal;
}

// Uso
const custosPorCC = new Map<string, CustoHora>([
  ['CC001', { homem: 50.00, maquina: 0 }],      // R$/h
  ['CC002', { homem: 60.00, maquina: 80.00 }],
  ['CC003', { homem: 45.00, maquina: 100.00 }]
]);

const custoTotal = await calcularCustoTotal('7530110', custosPorCC);
console.log(`Custo total estimado: R$ ${custoTotal.toFixed(2)}`);
```

## Dicas

1. **Cache**: As consultas são cacheadas automaticamente. Para forçar atualização, limpe o cache via endpoint `/admin/cache/clear`

2. **Performance**: Use o endpoint `/resumo` quando não precisar da árvore completa

3. **Data de Referência**: Útil para análises históricas ou simulações de cenários

4. **Correlação**: Use o `correlationId` retornado para rastrear requisições nos logs

5. **Swagger**: Teste interativamente em `http://localhost:3000/api-docs`
