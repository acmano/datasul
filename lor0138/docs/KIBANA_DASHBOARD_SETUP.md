# Configuração do Dashboard Kibana - LOR0138 Logs

Este documento fornece instruções passo a passo para criar um dashboard Kibana para visualizar e analisar logs do frontend LOR0138.

## Pré-requisitos

- Elasticsearch rodando com logs sendo enviados
- Kibana instalado e configurado
- Acesso ao Kibana (URL padrão: http://localhost:5601)

## Índice

1. [Criar Index Pattern](#1-criar-index-pattern)
2. [Criar Visualizações](#2-criar-visualizações)
3. [Criar Dashboard](#3-criar-dashboard)
4. [Configurar Alertas (Opcional)](#4-configurar-alertas-opcional)

---

## 1. Criar Index Pattern

O Index Pattern permite ao Kibana identificar e buscar logs no Elasticsearch.

### Passos:

1. Acesse o Kibana: `http://localhost:5601`
2. No menu lateral, vá em **Management** > **Stack Management**
3. Em **Kibana**, clique em **Index Patterns**
4. Clique em **Create index pattern**
5. No campo **Index pattern name**, digite: `lor0138-logs-*`
6. Clique em **Next step**
7. No campo **Time field**, selecione: `@timestamp`
8. Clique em **Create index pattern**

**Resultado:** O Kibana agora pode buscar logs com o prefixo `lor0138-logs-` (ex: `lor0138-logs-2025.10.25`).

---

## 2. Criar Visualizações

Visualizações são gráficos e tabelas que exibem seus dados de forma significativa.

### 2.1 Timeline de Erros (Line Chart)

Mostra a quantidade de erros ao longo do tempo.

**Passos:**

1. No menu lateral, vá em **Visualize Library**
2. Clique em **Create visualization**
3. Selecione **Line** (gráfico de linha)
4. Selecione o index pattern: `lor0138-logs-*`
5. Configure o gráfico:
   - **Y-axis (Vertical):**
     - Aggregation: `Count`
   - **X-axis (Horizontal):**
     - Aggregation: `Date Histogram`
     - Field: `@timestamp`
     - Interval: `Auto`
   - **Filters:**
     - Adicione filtro: `severity: error`
6. Clique em **Save** e nomeie: `LOR0138 - Timeline de Erros`

**Resultado:** Gráfico de linha mostrando a evolução de erros ao longo do tempo.

---

### 2.2 Top 10 Mensagens de Erro (Data Table)

Lista as 10 mensagens de erro mais frequentes.

**Passos:**

1. No menu lateral, vá em **Visualize Library**
2. Clique em **Create visualization**
3. Selecione **Table** (tabela)
4. Selecione o index pattern: `lor0138-logs-*`
5. Configure a tabela:
   - **Filters:**
     - Adicione filtro: `severity: error`
   - **Metrics:**
     - Aggregation: `Count`
   - **Buckets:**
     - Aggregation: `Terms`
     - Field: `message.keyword`
     - Order By: `Metric: Count`
     - Order: `Descending`
     - Size: `10`
6. Clique em **Save** e nomeie: `LOR0138 - Top 10 Mensagens de Erro`

**Resultado:** Tabela com as 10 mensagens de erro mais comuns e suas contagens.

---

### 2.3 Erros por Correlation ID (Data Table)

Agrupa erros pelo Correlation ID para facilitar debugging.

**Passos:**

1. No menu lateral, vá em **Visualize Library**
2. Clique em **Create visualization**
3. Selecione **Table** (tabela)
4. Selecione o index pattern: `lor0138-logs-*`
5. Configure a tabela:
   - **Filters:**
     - Adicione filtro: `severity: error`
     - Adicione filtro: `fields.correlationId: *` (existe correlationId)
   - **Metrics:**
     - Aggregation: `Count`
   - **Buckets:**
     - Aggregation: `Terms`
     - Field: `fields.correlationId.keyword`
     - Order By: `Metric: Count`
     - Order: `Descending`
     - Size: `20`
6. Adicione segunda coluna:
   - **Split rows:**
     - Sub-aggregation: `Terms`
     - Field: `message.keyword`
     - Size: `3`
7. Clique em **Save** e nomeie: `LOR0138 - Erros por Correlation ID`

**Resultado:** Tabela agrupando erros por Correlation ID, facilitando rastrear problemas específicos.

---

### 2.4 Logs por Level (Pie Chart)

Mostra distribuição de logs por nível (debug, info, warn, error).

**Passos:**

1. No menu lateral, vá em **Visualize Library**
2. Clique em **Create visualization**
3. Selecione **Pie** (gráfico de pizza)
4. Selecione o index pattern: `lor0138-logs-*`
5. Configure o gráfico:
   - **Metrics:**
     - Aggregation: `Count`
   - **Buckets:**
     - Aggregation: `Terms`
     - Field: `severity.keyword`
     - Order By: `Metric: Count`
     - Order: `Descending`
6. Clique em **Save** e nomeie: `LOR0138 - Logs por Level`

**Resultado:** Gráfico de pizza mostrando proporção de logs por severidade.

---

### 2.5 Erros por URL (Bar Chart)

Mostra quais páginas geram mais erros.

**Passos:**

1. No menu lateral, vá em **Visualize Library**
2. Clique em **Create visualization**
3. Selecione **Horizontal Bar** (barras horizontais)
4. Selecione o index pattern: `lor0138-logs-*`
5. Configure o gráfico:
   - **Filters:**
     - Adicione filtro: `severity: error`
   - **Y-axis (Vertical):**
     - Aggregation: `Terms`
     - Field: `fields.url.keyword`
     - Order By: `Metric: Count`
     - Order: `Descending`
     - Size: `10`
   - **X-axis (Horizontal):**
     - Aggregation: `Count`
6. Clique em **Save** e nomeie: `LOR0138 - Erros por URL`

**Resultado:** Gráfico de barras mostrando as 10 URLs com mais erros.

---

### 2.6 Logs Recentes (Saved Search)

Tabela com os logs mais recentes para análise detalhada.

**Passos:**

1. No menu lateral, vá em **Discover**
2. Selecione o index pattern: `lor0138-logs-*`
3. Configure as colunas:
   - Clique no ícone de engrenagem (configurações de campos)
   - Adicione campos:
     - `@timestamp`
     - `severity`
     - `message`
     - `fields.correlationId`
     - `fields.url`
     - `fields.context`
4. Configure filtro de tempo: `Last 24 hours`
5. Clique em **Save** no topo e nomeie: `LOR0138 - Logs Recentes`

**Resultado:** Busca salva mostrando logs recentes com campos relevantes.

---

## 3. Criar Dashboard

Agora vamos combinar todas as visualizações em um único dashboard.

### Passos:

1. No menu lateral, vá em **Dashboard**
2. Clique em **Create dashboard**
3. Clique em **Add from library**
4. Adicione as visualizações criadas:
   - `LOR0138 - Timeline de Erros`
   - `LOR0138 - Top 10 Mensagens de Erro`
   - `LOR0138 - Erros por Correlation ID`
   - `LOR0138 - Logs por Level`
   - `LOR0138 - Erros por URL`
   - `LOR0138 - Logs Recentes`
5. Organize as visualizações:
   - Arraste e redimensione os painéis
   - Sugestão de layout:
     ```
     ┌─────────────────────────────────────────┐
     │  Timeline de Erros (linha completa)     │
     ├────────────────────┬────────────────────┤
     │ Logs por Level     │ Erros por URL      │
     │ (pizza)            │ (barras)           │
     ├────────────────────┴────────────────────┤
     │  Top 10 Mensagens de Erro (tabela)      │
     ├─────────────────────────────────────────┤
     │  Erros por Correlation ID (tabela)      │
     ├─────────────────────────────────────────┤
     │  Logs Recentes (saved search)           │
     └─────────────────────────────────────────┘
     ```
6. Configure filtros globais:
   - Clique em **Add filter** no topo
   - Adicione: `fields.application: lor0138`
7. Configure time range padrão:
   - No canto superior direito, selecione: `Last 24 hours`
8. Clique em **Save** e nomeie: `LOR0138 - Logging Dashboard`
9. Marque como favorito (estrela) para acesso rápido

**Resultado:** Dashboard completo com todas as visualizações de logs do LOR0138.

---

## 4. Configurar Alertas (Opcional)

Configure alertas para ser notificado quando ocorrerem muitos erros.

### 4.1 Alerta de Erros Críticos

**Passos:**

1. No menu lateral, vá em **Observability** > **Alerts and Insights** > **Rules and Connectors**
2. Clique em **Create rule**
3. Selecione **Elasticsearch query**
4. Configure o alerta:
   - **Name:** `LOR0138 - Erros Críticos`
   - **Index:** `lor0138-logs-*`
   - **Query:**
     ```json
     {
       "query": {
         "bool": {
           "must": [
             { "term": { "severity": "error" } },
             { "term": { "fields.application": "lor0138" } }
           ]
         }
       }
     }
     ```
   - **Threshold:**
     - When: `count()`
     - Is above: `10`
     - For the last: `5 minutes`
5. Configure ação:
   - **Action type:** Email / Slack / Webhook
   - Configure o destinatário
6. Clique em **Save**

**Resultado:** Você será notificado quando houver mais de 10 erros em 5 minutos.

---

## 5. Dicas e Boas Práticas

### 5.1 Filtros Úteis

- **Ver apenas erros:** `severity: error`
- **Ver logs de uma página específica:** `fields.url: "/app/users"`
- **Ver logs de um usuário específico:** `fields.context.userId: "123"`
- **Ver logs com correlation ID:** `fields.correlationId: *`

### 5.2 Pesquisas Comuns

- **Erros em um componente específico:**
  ```
  severity: error AND fields.context.component: "UserProfile"
  ```

- **Erros de API:**
  ```
  message: "API Error" AND severity: error
  ```

- **Erros de autenticação:**
  ```
  message: "401" OR message: "unauthorized"
  ```

### 5.3 Atalhos de Teclado no Kibana

- `Ctrl + /` - Abre busca rápida
- `Ctrl + F` - Busca na página
- `t` - Define time range

### 5.4 Manutenção do Dashboard

- **Atualizar automaticamente:** Configure auto-refresh (10s, 30s, 1m)
- **Exportar dashboard:** Management > Saved Objects > Export
- **Compartilhar:** Clique em **Share** e copie link ou incorpore iframe

---

## 6. Troubleshooting

### Problema: Não vejo logs no Kibana

**Soluções:**

1. Verifique se Elasticsearch está recebendo logs:
   ```bash
   curl http://localhost:9200/lor0138-logs-*/_count
   ```
2. Verifique se o time range está correto (últimas 24h)
3. Verifique filtros aplicados (remova todos os filtros)

### Problema: Index Pattern não aparece

**Soluções:**

1. Verifique se o índice existe:
   ```bash
   curl http://localhost:9200/_cat/indices/lor0138-logs-*
   ```
2. Recrie o Index Pattern com o padrão correto
3. Aguarde alguns minutos para logs serem indexados

### Problema: Visualizações vazias

**Soluções:**

1. Verifique se há dados no período selecionado
2. Remova filtros que possam estar bloqueando dados
3. Verifique se o campo usado na agregação existe nos logs

---

## 7. Recursos Adicionais

- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Kibana Visualizations](https://www.elastic.co/guide/en/kibana/current/dashboard.html)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)

---

## Manutenção

Este documento deve ser atualizado quando:

- Novos campos forem adicionados aos logs
- Novas visualizações forem criadas
- Alertas forem modificados
- Requisitos de monitoramento mudarem

**Última atualização:** 2025-10-25
