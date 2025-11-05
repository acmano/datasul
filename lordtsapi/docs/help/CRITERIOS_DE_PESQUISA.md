# Critérios de Pesquisa - Como Funciona a Busca

## Visão Geral

A busca de itens permite que você encontre produtos usando diferentes critérios. Você **não precisa preencher todos os campos** - apenas informe os critérios que você conhece e o sistema vai buscar usando apenas esses campos.

## Campos Disponíveis para Busca

Você pode buscar itens usando os seguintes campos:

### 1. Código do Item
- **Tipo:** Texto (até 16 caracteres)
- **Aceita curingas:** ✅ Sim (`*` ou `%`)
- **Exemplo:** `7530110` ou `753%`

### 2. Descrição
- **Tipo:** Texto (até 200 caracteres)
- **Aceita curingas:** ✅ Sim (`*` ou `%`)
- **Exemplo:** `VALVULA` ou `%PARAFUSO%`

### 3. Família
- **Tipo:** Código (até 8 caracteres)
- **Aceita curingas:** ❌ Não (busca exata)
- **Exemplo:** `450000`
- **Seleção:** Dropdown pré-carregado

### 4. Família Comercial
- **Tipo:** Código (até 8 caracteres)
- **Aceita curingas:** ❌ Não (busca exata)
- **Exemplo:** `A02001`
- **Seleção:** Dropdown pré-carregado

### 5. Grupo de Estoque
- **Tipo:** Código (até 8 caracteres)
- **Aceita curingas:** ❌ Não (busca exata)
- **Exemplo:** `40`
- **Seleção:** Dropdown pré-carregado

### 6. GTIN (Código de Barras)
- **Tipo:** Numérico (13 ou 14 dígitos)
- **Aceita curingas:** ❌ Não (apenas números)
- **Exemplo:** `7896451824813`
- **Comportamento especial:** Ver seção abaixo

## Como os Critérios Funcionam?

### Critérios Dinâmicos

**Importante:** O sistema usa APENAS os campos que você preencher!

- Se você informar apenas a Família, o sistema busca apenas por Família
- Se você informar Família + Descrição, o sistema busca por ambos
- Você não é obrigado a preencher todos os campos

### Combinação com "E" (AND)

Quando você informa **mais de um critério**, todos eles devem ser satisfeitos. É como dizer "quero itens que atendam a condição A **E** condição B **E** condição C".

#### Exemplo 1: Um critério apenas
```
Família: 450000
```
**Resultado:** Todos os itens da família 450000

#### Exemplo 2: Dois critérios (E)
```
Família: 450000
Descrição: %BRONZE%
```
**Resultado:** Itens que são da família 450000 **E** contêm "BRONZE" na descrição

#### Exemplo 3: Três critérios (E)
```
Família: 450000
Grupo de Estoque: 40
Código: 7%
```
**Resultado:** Itens da família 450000 **E** do grupo 40 **E** cujo código começa com "7"

## Comportamento Especial do GTIN

### O que é GTIN?

GTIN é o código de barras do produto. Existem dois tipos:
- **GTIN-13** (EAN): 13 dígitos (mais comum no Brasil)
- **GTIN-14** (DUN): 14 dígitos (caixas/paletes)

### Como a busca funciona?

Quando você busca por GTIN, o sistema faz algo especial:

1. **Busca em DOIS campos ao mesmo tempo**
   - Verifica se o GTIN está no campo GTIN-13
   - **OU** verifica se o GTIN está no campo GTIN-14
   - Se encontrar em qualquer um dos dois, retorna o item

2. **Retorna apenas itens com GTIN cadastrado**
   - Se você buscar por GTIN, só aparecem itens que têm GTIN
   - Itens sem GTIN cadastrado não aparecerão no resultado

3. **Aceita apenas números**
   - Digite apenas os números: `7896451824813`
   - **Não use** hífens: `7896-451-824-813` ❌
   - **Não use** espaços: `7896 451 824 813` ❌
   - **Não use** curingas: `7896%` ❌

### Exemplos com GTIN

#### Busca apenas por GTIN
```
GTIN: 7896451824813
```
**Resultado:** O item que possui esse GTIN (em gtin13 OU gtin14)

#### Busca por GTIN + outros critérios
```
GTIN: 7896451824813
Família: 450000
```
**Resultado:** Item com esse GTIN **E** que seja da família 450000

## Busca Exata vs. Busca com Curingas

### Busca Exata (sem curingas)

Se você **não** usar caracteres curinga (`%` ou `*`), o sistema busca o valor **exato**.

```
Código: 7530110
```
→ Encontra APENAS o item com código "7530110"

```
Descrição: PARAFUSO
```
→ Encontra APENAS itens cuja descrição seja exatamente "PARAFUSO"

### Busca com Curingas (flexível)

Use `%` ou `*` para buscas mais flexíveis:

```
Código: 753%
```
→ Encontra todos os códigos que começam com "753"

```
Descrição: %PARAFUSO%
```
→ Encontra qualquer item que contenha "PARAFUSO" na descrição

**Para mais detalhes sobre curingas, consulte:** [Caracteres Curinga](./CARACTERES_CURINGA.md)

## Exemplos Práticos

### Cenário 1: Sabe apenas a família
**Situação:** Você quer ver todos os itens de uma família

**Como fazer:**
```
Família: 450000
```

**Resultado:** Todos os itens da família 450000

### Cenário 2: Família + palavra-chave
**Situação:** Você quer válvulas de bronze da família 450000

**Como fazer:**
```
Família: 450000
Descrição: %BRONZE%
```

**Resultado:** Itens da família 450000 que contêm "BRONZE"

### Cenário 3: Busca refinada com 3 critérios
**Situação:** Você quer itens específicos com múltiplas características

**Como fazer:**
```
Família: 450000
Grupo de Estoque: 40
Código: 7%
```

**Resultado:** Itens que atendem TODAS essas condições:
- São da família 450000 **E**
- Pertencem ao grupo de estoque 40 **E**
- Têm código começando com "7"

### Cenário 4: Busca por código de barras
**Situação:** Você tem o código de barras e quer encontrar o item

**Como fazer:**
```
GTIN: 7896451824813
```

**Resultado:** O item que possui esse GTIN (busca em gtin13 e gtin14)

### Cenário 5: Procura por palavra na descrição
**Situação:** Você não sabe o código, mas lembra de uma palavra

**Como fazer:**
```
Descrição: %VALVULA%
```

**Resultado:** Todos os itens que contêm "VALVULA" na descrição

## Dicas de Uso

### Para buscar mais rápido:

1. **Combine critérios**
   - Quanto mais específico, mais rápido
   - Exemplo: Família + Código é mais rápido que só Descrição

2. **Use prefixos em vez de sufixos**
   - `ABC%` é mais rápido que `%ABC`
   - Começa com "ABC" é mais eficiente que termina com "ABC"

3. **Seja específico quando possível**
   - Evite buscas muito genéricas como `%A%`

### Para encontrar mais resultados:

1. **Use curingas generosos**
   - `%VALV%` encontra mais que `VALVULA`

2. **Tente palavras-chave diferentes**
   - Se não achar com "PARAFUSO", tente "PARAFU" ou "FUSO"

3. **Remova critérios desnecessários**
   - Se não encontrar com 3 critérios, tente com 2

## Limitações

### Quantidade de Resultados
- **Máximo:** 100 itens por busca
- Se houver mais de 100 resultados, apenas os primeiros 100 são retornados
- **Dica:** Refine sua busca com mais critérios

### Tempo de Resposta
- Buscas simples: ~100-200ms
- Buscas com curingas: ~300-500ms
- Buscas por família: ~500-800ms
- **Timeout:** Se a busca demorar mais de 30 segundos, ela será cancelada

### Cache
- Resultados são guardados em cache por 10 minutos
- A mesma busca será mais rápida na segunda vez
- Cache é compartilhado entre usuários

## Troubleshooting - Problemas Comuns

### "Nenhum resultado encontrado"

**Possíveis causas:**

1. ✅ **Item não existe**
   - Verifique se o item está cadastrado no ERP

2. ✅ **Busca muito específica (busca exata)**
   - Sem curingas, a busca é exata
   - **Solução:** Tente adicionar `%` antes e depois: `%valor%`

3. ✅ **GTIN informado mas item não tem GTIN cadastrado**
   - Se você buscar por GTIN, só aparecem itens que TÊM GTIN
   - **Solução:** Busque por código ou descrição

4. ✅ **Combinação de critérios muito restritiva**
   - Todos os critérios devem ser satisfeitos (E)
   - **Solução:** Remova alguns critérios

### "Muitos resultados, não sei qual é"

**Soluções:**

1. Adicione mais critérios (Família, Grupo de Estoque)
2. Use uma palavra mais específica na descrição
3. Use o prefixo do código se souber

### "Busca está muito lenta"

**Soluções:**

1. Adicione a Família ou Grupo de Estoque
2. Use curingas mais específicos
3. Comece a palavra com letras conhecidas (não use `%` no início)
4. Evite buscas muito abrangentes

### "Erro de validação"

**Causas comuns:**

1. **GTIN com caracteres não numéricos**
   - Use apenas números: `7896451824813`
   - Não use hífens, espaços ou letras

2. **Nenhum campo preenchido**
   - Você precisa informar pelo menos um critério

3. **Campo muito longo**
   - Código: máximo 16 caracteres
   - Descrição: máximo 200 caracteres

## Perguntas Frequentes

### Preciso preencher todos os campos?

Não! Preencha apenas os campos que você conhece. O sistema usa apenas os campos informados.

### Posso buscar por parte do código?

Sim! Use curingas: `753%` para códigos que começam com "753"

### Como busco itens que contêm uma palavra?

Use curingas: `%PALAVRA%` na descrição

### Posso combinar busca por família e descrição?

Sim! Combine quantos critérios quiser. Todos devem ser satisfeitos.

### O GTIN deve ter quantos dígitos?

13 ou 14 dígitos, apenas números.

### Por que alguns itens não aparecem quando busco por GTIN?

Quando você busca por GTIN, só aparecem itens que têm GTIN cadastrado. Se o item não tem GTIN, busque por código ou descrição.

### A busca diferencia maiúsculas e minúsculas?

Geralmente não. "PARAFUSO" e "parafuso" são tratados da mesma forma.

### Quantos resultados posso obter?

Máximo de 100 itens por busca.

## Precisa de mais ajuda?

Consulte também:
- [Caracteres Curinga](./CARACTERES_CURINGA.md) - Como usar `%` e `*` nas buscas
- [README do módulo search](../../src/item/search/README.md) - Documentação técnica completa
