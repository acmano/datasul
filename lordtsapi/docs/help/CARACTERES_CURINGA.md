# Caracteres Curinga na Busca de Itens

## O que são caracteres curinga?

Caracteres curinga (também chamados de "wildcards") são símbolos especiais que você pode usar para fazer buscas mais flexíveis. Eles funcionam como "coringas" que representam qualquer caractere ou conjunto de caracteres.

## Quais campos aceitam caracteres curinga?

Nem todos os campos da busca aceitam caracteres curinga:

| Campo | Aceita Curinga? | Como funciona |
|-------|----------------|---------------|
| **Código do Item** | ✅ Sim | Você pode usar `*` ou `%` para buscar partes do código |
| **Descrição** | ✅ Sim | Você pode usar `*` ou `%` para buscar palavras na descrição |
| **Família** | ❌ Não | Apenas busca exata - deve digitar o código completo |
| **Família Comercial** | ❌ Não | Apenas busca exata - deve digitar o código completo |
| **Grupo de Estoque** | ❌ Não | Apenas busca exata - deve digitar o código completo |
| **GTIN/Código de Barras** | ❌ Não | Apenas números exatos - sem caracteres especiais |

## Quais caracteres curinga posso usar?

Você pode usar dois tipos de caracteres curinga, que funcionam de forma idêntica:

### Percentual (`%`)
O caractere `%` (percentual) representa **zero ou mais caracteres** de qualquer tipo.

### Asterisco (`*`)
O caractere `*` (asterisco) funciona exatamente igual ao `%`. O sistema converte automaticamente `*` para `%`.

**Dica:** Use o que for mais fácil para você. Os dois funcionam da mesma forma!

## Como usar na prática?

### 1️⃣ Buscar itens que CONTÊM uma palavra

**O que você quer:** Encontrar todos os itens que contêm "PARAFUSO" na descrição

**Como fazer:**
```
Campo Descrição: %PARAFUSO%
```

**O que você vai encontrar:**
- "**PARAFUSO** SEXTAVADO M10"
- "CONJUNTO DE **PARAFUSO**S"
- "KIT **PARAFUSO** E PORCA"

### 2️⃣ Buscar itens que COMEÇAM com algo

**O que você quer:** Encontrar todos os itens cujo código começa com "753"

**Como fazer:**
```
Campo Código: 753%
```

**O que você vai encontrar:**
- "**753**0110"
- "**753**2450"
- "**753**9999"

### 3️⃣ Buscar itens que TERMINAM com algo

**O que você quer:** Encontrar todos os itens cujo código termina com "001"

**Como fazer:**
```
Campo Código: %001
```

**O que você vai encontrar:**
- "ABC**001**"
- "XYZ**001**"
- "1234**001**"

### 4️⃣ Buscar uma palavra específica no meio

**O que você quer:** Encontrar itens que contêm a palavra "BRONZE" na descrição

**Como fazer:**
```
Campo Descrição: %BRONZE%
```

**O que você vai encontrar:**
- "VÁLVULA **BRONZE** 1/2"
- "TORNEIRA **BRONZE** CROMADO"
- "CONJUNTO **BRONZE** E LATÃO"

## ⚠️ IMPORTANTE: Busca Exata vs. Busca com Curinga

Se você **NÃO** digitar caracteres curinga, a busca será **EXATA**. Isso significa que o sistema só vai encontrar itens que correspondam perfeitamente ao que você digitou.

### Exemplos:

**Busca SEM curinga (exata):**
```
Descrição: PARAFUSO
```
→ Encontra APENAS itens cuja descrição seja exatamente "PARAFUSO" (nada mais, nada menos)

**Busca COM curinga (flexível):**
```
Descrição: %PARAFUSO%
```
→ Encontra qualquer item que contenha "PARAFUSO" em qualquer parte da descrição

**Dica importante:** Se você não encontrar o que procura, tente adicionar `%` antes e depois da palavra!

## Combinando Múltiplos Critérios

Você pode combinar buscas com curinga em diferentes campos. Todos os critérios que você informar devem ser satisfeitos (funciona como um "E").

### Exemplo prático:

**Você quer:** Itens da família 450000 que contêm "BRONZE" na descrição e cujo código começa com "7"

**Como fazer:**
- Família: `450000` (sem curinga - exato)
- Descrição: `%BRONZE%` (com curinga - contém)
- Código: `7%` (com curinga - começa com)

**Resultado:** O sistema vai buscar itens que atendam **TODOS** esses critérios ao mesmo tempo.

## Dicas e Boas Práticas

### ✅ Faça:

1. **Use curingas quando não souber o valor completo**
   - Exemplo: `%VALV%` para encontrar válvulas

2. **Combine critérios para refinar a busca**
   - Exemplo: Família + palavra-chave na descrição

3. **Use `%palavra%` para buscar palavras que aparecem em qualquer posição**
   - Encontra mais resultados

4. **Prefira começar com caracteres conhecidos**
   - `ABC%` é mais rápido que `%ABC`

### ❌ Não faça:

1. **Não use curingas em campos que não aceitam**
   - GTIN não aceita: use apenas números
   - Família, Família Comercial, Grupo de Estoque: use códigos exatos

2. **Evite buscas muito genéricas**
   - Buscar apenas `%A%` pode retornar muitos resultados e ser lento

3. **Não esqueça os curingas quando quiser busca flexível**
   - Sem `%`, a busca será exata

## Exemplos Reais

### Cenário 1: Procurando válvulas
```
Descrição: %VALV%
```
Encontra: VALVULA, VALVULAS, VÁLVULA, etc.

### Cenário 2: Itens de uma família específica com "BRONZE"
```
Família: 450000
Descrição: %BRONZE%
```
Encontra: Todos os itens da família 450000 que contêm "BRONZE"

### Cenário 3: Códigos que começam com prefixo específico
```
Código: 7530%
```
Encontra: 7530110, 7530220, 7530999, etc.

### Cenário 4: Busca por código de barras
```
GTIN: 7896451824813
```
⚠️ Note: SEM curingas! Apenas números exatos.

## Perguntas Frequentes

### Por que não encontrei resultados?

1. **Você esqueceu de colocar os curingas?**
   - Sem `%`, a busca é exata

2. **O item realmente existe?**
   - Verifique no ERP se o item está cadastrado

3. **Você usou curinga em campo que não aceita?**
   - GTIN, Família, Grupo: não aceitam curingas

### Qual a diferença entre `*` e `%`?

Nenhuma! Os dois funcionam exatamente da mesma forma. Use o que preferir.

### Posso usar curinga no GTIN?

Não. O campo GTIN aceita apenas números (13 ou 14 dígitos). Não use curingas, hífens ou espaços.

### A busca diferencia maiúsculas de minúsculas?

Depende da configuração do banco de dados, mas geralmente não. "PARAFUSO" e "parafuso" são tratados da mesma forma.

## Precisa de mais ajuda?

Consulte também:
- [Critérios de Pesquisa](./CRITERIOS_DE_PESQUISA.md) - Como combinar múltiplos campos
- [README do módulo search](../../src/item/search/README.md) - Documentação técnica completa
