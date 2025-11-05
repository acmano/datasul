# GitHub Packages - Guia de Segurança

## Visão Geral

Este projeto utiliza o pacote privado `@acmano/lordtsapi-shared-types` hospedado no GitHub Packages. Este guia explica como configurar o acesso de forma segura, tanto localmente quanto no CI/CD.

---

## Por que tokens NÃO devem estar no repositório?

### Riscos de Segurança

1. **Exposição Pública**: Se o repositório for público ou vazado, seu token fica exposto
2. **Acesso Não Autorizado**: Qualquer pessoa com o token pode acessar seus pacotes privados
3. **Histórico Git**: Mesmo removendo depois, o token fica no histórico do Git
4. **Compliance**: Viola políticas de segurança e compliance (SOC2, ISO27001)

### Boa Prática

- Tokens devem estar em:
  - **Arquivos ignorados pelo Git** (.npmrc no .gitignore)
  - **Variáveis de ambiente** (localmente)
  - **Secrets do CI/CD** (GitHub Actions, Jenkins, etc.)

---

## Configuração Local

### Passo 1: Criar Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** > **"Generate new token (classic)"**
3. Configure:
   - **Note**: "NPM Package Read Access - LOR0138"
   - **Expiration**: 90 dias (recomendado)
   - **Scopes**:
     - `read:packages` (obrigatório)
     - `repo` (opcional, se precisar acessar repos privados)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você não verá novamente!)

### Passo 2: Configurar .npmrc local

```bash
# 1. Copie o arquivo de exemplo
cp .npmrc.example .npmrc

# 2. Edite o .npmrc
nano .npmrc  # ou use seu editor preferido

# 3. Substitua ${GITHUB_TOKEN} pelo seu token
# De:
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

# Para:
//npm.pkg.github.com/:_authToken=ghp_seu_token_aqui_1234567890abcdef
```

**Conteúdo final do .npmrc:**
```
@acmano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_seu_token_aqui_1234567890abcdef
legacy-peer-deps=true
```

### Passo 3: Verificar configuração

```bash
# Deve mostrar o registry correto
npm config get @acmano:registry
# Saída esperada: https://npm.pkg.github.com

# Tente instalar as dependências
npm install

# Se funcionar, está configurado corretamente!
```

### IMPORTANTE

- **NUNCA commit o .npmrc** - Ele já está no .gitignore
- **Não compartilhe seu token** - É pessoal e intransferível
- **Renove periodicamente** - Crie novo token antes do vencimento

---

## Configuração no CI/CD

### GitHub Actions (Atual)

O workflow já está configurado para usar o token automático do GitHub:

```yaml
- name: Configure NPM for GitHub Packages
  run: |
    rm -f .npmrc
    echo "@acmano:registry=https://npm.pkg.github.com" > .npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc
    echo "legacy-peer-deps=true" >> .npmrc

- name: Install dependencies
  run: npm ci --legacy-peer-deps
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Como funciona:**
1. O GitHub Actions fornece automaticamente `GITHUB_TOKEN` para cada workflow
2. Esse token tem permissões de leitura de pacotes do mesmo repositório/organização
3. O .npmrc é criado dinamicamente durante o build (não está no repo)
4. Após o build, o .npmrc é descartado

### Outros CI/CD (Jenkins, GitLab CI, etc.)

Se usar outro CI/CD, você precisa:

1. **Criar um token de serviço** (não use seu token pessoal!)
2. **Adicionar como secret** no CI/CD
3. **Configurar no pipeline**:

```bash
# Exemplo genérico
echo "@acmano:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc
npm ci --legacy-peer-deps
```

---

## Troubleshooting

### Erro: "401 Unauthorized"

**Causa**: Token inválido, expirado ou sem permissões

**Solução**:
```bash
# 1. Verifique se o token está correto no .npmrc
cat .npmrc

# 2. Teste o token manualmente
curl -H "Authorization: token SEU_TOKEN" \
     https://api.github.com/user

# 3. Se retornar seus dados, o token está válido
# 4. Verifique se tem scope read:packages
# 5. Se necessário, crie novo token
```

### Erro: "404 Not Found"

**Causa**: Pacote não encontrado ou registry incorreto

**Solução**:
```bash
# Verifique o registry
npm config get @acmano:registry

# Deve retornar: https://npm.pkg.github.com

# Se não, configure manualmente
npm config set @acmano:registry https://npm.pkg.github.com
```

### Erro: "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"

**Causa**: Problemas com certificados SSL (comum em redes corporativas)

**Solução**:
```bash
# ATENÇÃO: Use apenas em ambiente de desenvolvimento
npm config set strict-ssl false

# Ou instale os certificados corretos da sua empresa
```

### Token expirou

**Solução**:
```bash
# 1. Crie novo token no GitHub (mesmos passos do início)
# 2. Atualize o .npmrc com novo token
# 3. Reinstale dependências
rm -rf node_modules package-lock.json
npm install
```

---

## Rotação de Tokens

### Por que rotacionar?

- Segurança proativa (mesmo que não tenha vazado)
- Compliance (muitas políticas exigem rotação periódica)
- Reduzir janela de impacto se comprometido

### Como rotacionar (a cada 90 dias)

#### 1. Criar novo token
```bash
# Siga os passos em "Configuração Local" para criar novo token
```

#### 2. Atualizar localmente
```bash
# Edite o .npmrc
nano .npmrc

# Substitua o token antigo pelo novo
# Salve e teste
npm install
```

#### 3. Atualizar CI/CD (se necessário)
```bash
# Se usar token personalizado no CI/CD (não GITHUB_TOKEN automático):
# 1. Acesse as configurações do CI/CD
# 2. Atualize o secret NPM_TOKEN
# 3. Execute novo build para testar
```

#### 4. Revogar token antigo
```bash
# 1. Acesse: https://github.com/settings/tokens
# 2. Encontre o token antigo
# 3. Clique em "Delete"
```

---

## Checklist de Segurança

Antes de fazer commit, verifique:

- [ ] .npmrc está no .gitignore
- [ ] .npmrc NÃO está staged no Git
- [ ] Token é de leitura apenas (read:packages)
- [ ] Token tem data de expiração
- [ ] .npmrc.example não tem tokens reais
- [ ] README tem instruções claras

```bash
# Verificar se .npmrc está ignorado
git status | grep .npmrc
# Não deve aparecer nada (ou deve estar em "Untracked files" se for primeira vez)

# Verificar conteúdo do .npmrc.example
cat .npmrc.example
# Deve ter ${GITHUB_TOKEN} e NÃO um token real
```

---

## Perguntas Frequentes

### Q: Posso compartilhar meu .npmrc com o time?
**A**: NÃO. Cada desenvolvedor deve ter seu próprio token. Use .npmrc.example como referência.

### Q: O que fazer se commitei o .npmrc por engano?
**A**:
1. Revogue o token imediatamente no GitHub
2. Remova do histórico Git:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .npmrc" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (CUIDADO: coordene com o time)
4. Crie novo token

### Q: Posso usar variável de ambiente em vez de .npmrc?
**A**: Sim! Configure:
```bash
export NPM_TOKEN=ghp_seu_token
npm config set //npm.pkg.github.com/:_authToken ${NPM_TOKEN}
```

### Q: Como saber se meu token está funcionando?
**A**:
```bash
# Teste direto na API do GitHub
curl -H "Authorization: token SEU_TOKEN" \
     https://npm.pkg.github.com/@acmano/lordtsapi-shared-types

# Ou tente instalar
npm install @acmano/lordtsapi-shared-types
```

---

## Referências

- [GitHub: Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [GitHub: Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [NPM: Using private packages in a CI/CD workflow](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow)

---

**Última atualização**: 2025-10-25
**Autor**: Equipe Lorenzetti
**Status**: Ativo
