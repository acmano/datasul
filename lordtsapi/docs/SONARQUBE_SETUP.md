# SonarQube Setup Guide

Este guia explica como configurar SonarQube/SonarCloud para análise de código do projeto.

## Opção 1: SonarCloud (Recomendado para GitHub)

### 1. Configurar SonarCloud

1. Acesse [sonarcloud.io](https://sonarcloud.io/)
2. Faça login com sua conta GitHub
3. Clique em "+" → "Analyze new project"
4. Selecione o repositório `lordtsapi-backend`
5. Siga o wizard de configuração

### 2. Obter Token

1. Vá em "My Account" → "Security"
2. Gere um novo token
3. Copie o token gerado

### 3. Configurar GitHub Secrets

1. No repositório GitHub, vá em "Settings" → "Secrets and variables" → "Actions"
2. Adicione um novo secret:
   - **Name**: `SONAR_TOKEN`
   - **Value**: [token copiado]

### 4. Atualizar Workflow

Edite `.github/workflows/sonarcloud.yml`:
```yaml
-Dsonar.organization=SUA-ORGANIZACAO  # Sua org no SonarCloud
-Dsonar.projectKey=lordtsapi-backend
```

### 5. Executar

O workflow roda automaticamente em:
- Push para `main` ou `develop`
- Pull requests

## Opção 2: SonarQube Local

### 1. Instalar SonarQube

**Docker (Recomendado):**
```bash
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:latest
```

**Ou via Docker Compose:**
```yaml
version: "3"
services:
  sonarqube:
    image: sonarqube:latest
    ports:
      - "9000:9000"
    environment:
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
```

### 2. Acessar SonarQube

1. Abra http://localhost:9000
2. Login padrão: `admin` / `admin`
3. Altere a senha quando solicitado

### 3. Criar Projeto

1. Clique em "Create Project"
2. Nome: `lordtsapi-backend`
3. Key: `lordtsapi-backend`
4. Gere um token de autenticação

### 4. Executar Análise Local

```bash
# Instalar SonarScanner
npm install -g sonarqube-scanner

# Executar testes com coverage
npm run test:coverage

# Executar análise
sonar-scanner \
  -Dsonar.projectKey=lordtsapi-backend \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=SEU_TOKEN
```

**Ou usar NPM script** (adicionar ao package.json):
```json
{
  "scripts": {
    "sonar": "sonar-scanner"
  }
}
```

## Configuração Avançada

### Quality Gates Customizados

No SonarQube/SonarCloud, configure Quality Gates:

**Métricas Recomendadas:**
- **Coverage**: ≥ 75%
- **Duplications**: ≤ 3%
- **Maintainability Rating**: A
- **Reliability Rating**: A
- **Security Rating**: A
- **Security Hotspots Reviewed**: 100%

### Exclusões Customizadas

Edite `sonar-project.properties`:

```properties
# Excluir arquivos gerados
sonar.exclusions=**/dist/**,**/node_modules/**,**/*.generated.ts

# Excluir arquivos de teste de duplicação
sonar.cpd.exclusions=**/*.test.ts,**/__mocks__/**

# Excluir da cobertura
sonar.coverage.exclusions=**/*.test.ts,**/types/**
```

### Regras Customizadas

**Desabilitar regra específica:**
```properties
sonar.issue.ignore.multicriteria=e1

sonar.issue.ignore.multicriteria.e1.ruleKey=typescript:S1186
sonar.issue.ignore.multicriteria.e1.resourceKey=**/*.test.ts
```

**Regras TypeScript comuns:**
- `typescript:S1186` - Empty function
- `typescript:S3776` - Cognitive Complexity
- `typescript:S125` - Commented out code
- `typescript:S1541` - Cyclomatic Complexity
- `typescript:S138` - Too many lines

## Integração CI/CD

### GitHub Actions

Já configurado em `.github/workflows/sonarcloud.yml`

### GitLab CI

```yaml
sonarqube:
  image: sonarsource/sonar-scanner-cli:latest
  script:
    - npm ci
    - npm run test:coverage
    - sonar-scanner
  only:
    - main
    - develop
```

### Jenkins

```groovy
stage('SonarQube Analysis') {
  steps {
    script {
      def scannerHome = tool 'SonarScanner'
      withSonarQubeEnv('SonarQube') {
        sh "${scannerHome}/bin/sonar-scanner"
      }
    }
  }
}
```

## Visualizar Resultados

### SonarCloud
https://sonarcloud.io/dashboard?id=lordtsapi-backend

### SonarQube Local
http://localhost:9000/dashboard?id=lordtsapi-backend

## Badges

Adicione badges ao README.md:

**SonarCloud:**
```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=lordtsapi-backend&metric=alert_status)](https://sonarcloud.io/dashboard?id=lordtsapi-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=lordtsapi-backend&metric=coverage)](https://sonarcloud.io/dashboard?id=lordtsapi-backend)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=lordtsapi-backend&metric=bugs)](https://sonarcloud.io/dashboard?id=lordtsapi-backend)
```

## Troubleshooting

### Erro: "Shallow clone detected"
```bash
# No GitHub Actions, use:
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### Erro: "No coverage report found"
```bash
# Certifique-se de que coverage está sendo gerado:
npm run test:coverage

# Verificar se lcov.info existe:
ls -la coverage/lcov.info
```

### Erro: "Authentication failed"
```bash
# Verificar token:
echo $SONAR_TOKEN

# Regenerar token se necessário
```

## Manutenção

### Atualizar SonarQube
```bash
docker pull sonarqube:latest
docker stop sonarqube
docker rm sonarqube
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```

### Limpar Análises Antigas
Via UI: Administration → Projects → [project] → Housekeeping

## Referências

- [SonarCloud Docs](https://docs.sonarcloud.io/)
- [SonarQube Docs](https://docs.sonarqube.org/)
- [SonarScanner for TypeScript](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/)
- [Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)
