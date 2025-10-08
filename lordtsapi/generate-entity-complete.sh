#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Uso: ./generate-entity-complete.sh <entity> <EntityCamelCase> <entityCodeField> <entityNameField> <progressTable>
# Exemplo: ./generate-entity-complete.sh grupoDeEstoque GrupoDeEstoque ge-codigo descricao grup-estoque

if [ $# -lt 5 ]; then
    echo "Uso: $0 <entity> <EntityCamelCase> <entityCodeField> <entityNameField> <progressTable>"
    echo "Exemplo: $0 grupoDeEstoque GrupoDeEstoque ge-codigo descricao grup-estoque"
    exit 1
fi

ENTITY=$1              # grupoDeEstoque
ENTITY_CAMEL=$2        # GrupoDeEstoque  
CODE_FIELD=$3          # ge-codigo
NAME_FIELD=$4          # descricao
PROGRESS_TABLE=$5      # grup-estoque

LORDTSAPI="/home/mano/projetos/datasul/lordtsapi"
BASE_PATH="src/${ENTITY}/dadosCadastrais/informacoesGerais"

cd "$LORDTSAPI"

echo -e "${BLUE}=== Gerando testes e refatorando ${ENTITY} ===${NC}\n"

# 1. Backup
echo -e "${BLUE}1. Criando backup...${NC}"
tar -czf "backup-${ENTITY}-$(date +%Y%m%d-%H%M%S).tar.gz" "$BASE_PATH"
echo -e "${GREEN}   ✓ Backup criado${NC}"

# 2. Refatorar Repository
echo -e "\n${BLUE}2. Refatorando repository...${NC}"

cat > "${BASE_PATH}/repository.ts" << EOF
// ${BASE_PATH}/repository.ts

/**
 * Repository - Informações Gerais do ${ENTITY_CAMEL}
 * 
 * REFATORADO para usar:
 * - @datasul/shared-types constants
 * - @shared/utils/repository helpers
 */

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

// ✅ Importar constants compartilhados
import { LINKED_SERVERS, PROGRESS_TABLES } from '@datasul/shared-types';

// ✅ Importar helpers
import {
  executeAndGetFirst,
  invalidateCachePatterns,
} from '@shared/utils/repository';

/**
 * Repository - ${ENTITY_CAMEL}
 */
export class ${ENTITY_CAMEL}InformacoesGeraisRepository {
  /**
   * Busca dados mestres
   */
  static async get${ENTITY_CAMEL}Master(${ENTITY}Codigo: string): Promise<any | null> {
    const query = \`
      DECLARE @${ENTITY}Codigo varchar(16) = @param${ENTITY_CAMEL}Codigo;
      DECLARE @sql nvarchar(max);

      SET @sql = N'
        SELECT  entity."${CODE_FIELD}" as ${ENTITY}Codigo
              , entity."${NAME_FIELD}" as ${ENTITY}Descricao
          FROM  OPENQUERY (
            \${LINKED_SERVERS.PRD_EMS2EMP}
          ,  ''SELECT  entity."${CODE_FIELD}"
                     , entity."${NAME_FIELD}"
                 FROM   pub."${PROGRESS_TABLE}" entity
                 WHERE  entity."${CODE_FIELD}" = ''''' + @${ENTITY}Codigo + '''''
             ''
          ) as entity
      ';

      EXEC sp_executesql @sql;
    \`;

    const params: QueryParameter[] = [
      { name: 'param${ENTITY_CAMEL}Codigo', type: 'varchar', value: ${ENTITY}Codigo }
    ];

    return executeAndGetFirst(
      query,
      params,
      QueryCacheService.with${ENTITY_CAMEL}Cache
    );
  }

  /**
   * Invalida cache
   */
  static async invalidateCache(${ENTITY}Codigo: string): Promise<void> {
    await invalidateCachePatterns(['${ENTITY}:*']);
  }
}
EOF

echo -e "${GREEN}   ✓ Repository refatorado${NC}"

# 3. Criar pasta __tests__
echo -e "\n${BLUE}3. Criando estrutura de testes...${NC}"
mkdir -p "${BASE_PATH}/__tests__"

# 4. Gerar service.test.ts
echo -e "${BLUE}4. Gerando service.test.ts...${NC}"

cat > "${BASE_PATH}/__tests__/service.test.ts" << 'SERVICETEST'
import { InformacoesGeraisService } from '../service';
import { ENTITY_CAMELInformacoesGeraisRepository } from '../repository';
import { ENTITY_CAMELNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService (ENTITY_CAMEL)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar informações quando encontrado', async () => {
      const mockData = {
        ENTITYCodigo: 'TEST123',
        ENTITYDescricao: 'Teste'
      };

      (ENTITY_CAMELInformacoesGeraisRepository.getENTITY_CAMELMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('TEST123');

      expect(result).toBeDefined();
      expect(result.identificacaoENTITY_CAMELCodigo).toBe('TEST123');
    });
  });

  describe('getInformacoesGerais - Não Encontrado', () => {
    it('deve lançar erro quando não existe', async () => {
      (ENTITY_CAMELInformacoesGeraisRepository.getENTITY_CAMELMaster as jest.Mock)
        .mockResolvedValue(null);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')
      ).rejects.toThrow(ENTITY_CAMELNotFoundError);
    });
  });

  describe('getInformacoesGerais - Erros', () => {
    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');
      
      (ENTITY_CAMELInformacoesGeraisRepository.getENTITY_CAMELMaster as jest.Mock)
        .mockRejectedValue(dbError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('TEST123')
      ).rejects.toThrow(DatabaseError);
    });
  });
});
SERVICETEST

# Substituir placeholders
sed -i "s/ENTITY_CAMEL/${ENTITY_CAMEL}/g" "${BASE_PATH}/__tests__/service.test.ts"
sed -i "s/ENTITY/${ENTITY}/g" "${BASE_PATH}/__tests__/service.test.ts"

echo -e "${GREEN}   ✓ service.test.ts criado${NC}"

# 5. Gerar repository.test.ts
echo -e "${BLUE}5. Gerando repository.test.ts...${NC}"

cat > "${BASE_PATH}/__tests__/repository.test.ts" << 'REPOTEST'
import { ENTITY_CAMELInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - ENTITY_CAMELInformacoesGeraisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getENTITY_CAMELMaster', () => {
    it('deve retornar dados quando encontrado', async () => {
      const mockData = [{
        ENTITYCodigo: 'TEST123',
        ENTITYDescricao: 'Teste'
      }];

      (QueryCacheService.withENTITY_CAMELCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockData);

      const result = await ENTITY_CAMELInformacoesGeraisRepository.getENTITY_CAMELMaster('TEST123');

      expect(result).toEqual(mockData[0]);
    });

    it('deve retornar null quando não encontrado', async () => {
      (QueryCacheService.withENTITY_CAMELCache as jest.Mock).mockImplementation(
        async (query, params, fetcher) => fetcher()
      );
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await ENTITY_CAMELInformacoesGeraisRepository.getENTITY_CAMELMaster('INEXISTENTE');

      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache corretamente', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await ENTITY_CAMELInformacoesGeraisRepository.invalidateCache('TEST123');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['ENTITY:*']);
    });
  });
});
REPOTEST

sed -i "s/ENTITY_CAMEL/${ENTITY_CAMEL}/g" "${BASE_PATH}/__tests__/repository.test.ts"
sed -i "s/ENTITY/${ENTITY}/g" "${BASE_PATH}/__tests__/repository.test.ts"

echo -e "${GREEN}   ✓ repository.test.ts criado${NC}"

# 6. Gerar controller.test.ts
echo -e "${BLUE}6. Gerando controller.test.ts...${NC}"

cat > "${BASE_PATH}/__tests__/controller.test.ts" << 'CONTROLLERTEST'
import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisController } from '../controller';
import { InformacoesGeraisService } from '../service';
import { ENTITY_CAMELNotFoundError, ValidationError } from '@shared/errors/CustomErrors';

jest.mock('../service');

describe('Controller - InformacoesGeraisController (ENTITY_CAMEL)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = { params: {} };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar 200 com dados', async () => {
      const mockData = { test: 'data' };
      mockRequest.params = { ENTITYCodigo: 'TEST123' };

      (InformacoesGeraisService.getInformacoesGerais as jest.Mock).mockResolvedValue(mockData);

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });
  });

  describe('getInformacoesGerais - Validação', () => {
    it('deve lançar ValidationError se código ausente', async () => {
      mockRequest.params = {};

      await InformacoesGeraisController.getInformacoesGerais(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});
CONTROLLERTEST

sed -i "s/ENTITY_CAMEL/${ENTITY_CAMEL}/g" "${BASE_PATH}/__tests__/controller.test.ts"
sed -i "s/ENTITY/${ENTITY}/g" "${BASE_PATH}/__tests__/controller.test.ts"

echo -e "${GREEN}   ✓ controller.test.ts criado${NC}"

# 7. Testar compilação
echo -e "\n${BLUE}7. Testando compilação...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}=====================================${NC}"
    echo -e "${GREEN}✓ ${ENTITY} completo!${NC}"
    echo -e "${GREEN}=====================================${NC}\n"
    
    echo -e "${BLUE}Criado:${NC}"
    echo "  • repository.ts (refatorado)"
    echo "  • __tests__/service.test.ts"
    echo "  • __tests__/repository.test.ts"
    echo "  • __tests__/controller.test.ts"
    echo ""
    
    echo -e "${BLUE}Testar:${NC}"
    echo "  npm test -- ${ENTITY}"
    
else
    echo -e "\n${YELLOW}⚠ Erros de compilação${NC}"
    echo "Restaurando backup..."
    tar -xzf backup-${ENTITY}-*.tar.gz
    exit 1
fi
