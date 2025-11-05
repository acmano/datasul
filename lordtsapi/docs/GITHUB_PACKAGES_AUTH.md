# Autenticação GitHub Packages - Troubleshooting

## Problema

O GitHub Actions falha ao instalar dependências com erro:

```
npm error 403 403 Forbidden - GET https://npm.pkg.github.com/download/@acmano/lordtsapi-shared-types/...
npm error 403 Permission permission_denied: read_package
```

## Causa

O `GITHUB_TOKEN` automático pode não ter permissões suficientes para ler pacotes privados do GitHub Packages em runners self-hosted.

## Soluções

### Opção 1: Configurar Permissões do Workflow (Já Implementado)

O workflow já está configurado com:

```yaml
permissions:
  contents: read
  packages: read
```

Isso deve funcionar na maioria dos casos.

### Opção 2: Usar Personal Access Token (PAT)

Se a Opção 1 não funcionar, crie um PAT com permissão `read:packages`:

#### Passo 1: Criar o PAT

1. Acesse: https://github.com/settings/tokens/new
2. Configure:
   - **Note**: `LORDTSAPI_NPM_TOKEN`
   - **Expiration**: `No expiration` (ou escolha um período)
   - **Scopes**: Marque apenas `read:packages`
3. Clique em "Generate token"
4. **COPIE O TOKEN** (você não conseguirá vê-lo novamente!)

#### Passo 2: Adicionar como Secret

1. Acesse: https://github.com/acmano/lordtsapi/settings/secrets/actions
2. Clique em "New repository secret"
3. Configure:
   - **Name**: `NPM_TOKEN`
   - **Value**: Cole o token que você copiou
4. Clique em "Add secret"

#### Passo 3: Testar

O workflow já está configurado para usar `NPM_TOKEN` se existir:

```yaml
TOKEN="${{ secrets.NPM_TOKEN || secrets.GITHUB_TOKEN }}"
```

Faça um novo push e o workflow deve funcionar.

## Verificação

Para verificar se a autenticação está funcionando localmente:

```bash
# Testar autenticação
npm whoami --registry=https://npm.pkg.github.com

# Instalar pacote privado
npm install @acmano/lordtsapi-shared-types
```

## Referências

- [GitHub Packages Authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)
- [Creating a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
