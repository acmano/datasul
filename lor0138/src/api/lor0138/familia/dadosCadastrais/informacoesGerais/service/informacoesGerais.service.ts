// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { FamiliaInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, FamiliaNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * =============================================================================
 * SERVICE - INFORMAÇÕES GERAIS DA FAMÍLIA
 * =============================================================================
 *
 * Camada de lógica de negócio para operações relacionadas às informações
 * gerais de itens do sistema Datasul.
 *
 * @module InformacoesGeraisService
 * @category Services
 * @subcategory Familia/DadosCadastrais
 *
 * RESPONSABILIDADES:
 * - Orquestrar chamadas ao Repository (master)
 * - Transformar dados brutos do banco em DTOs de resposta
 * - Aplicar regras de negócio (ex: mapeamento de statusIndex)
 * - Tratar e propagar erros de forma adequada
 * - Registrar eventos importantes (logging)
 *
 * ARQUITETURA:
 * - Camada intermediária entre Controller e Repository
 * - Não contém lógica de validação (feita no Controller)
 * - Não acessa banco diretamente (usa Repository)
 * - Converte exceções técnicas em erros de domínio
 *
 * PADRÃO DE PROJETO:
 * - Service Layer Pattern
 * - Métodos estáticos (stateless)
 * - Transaction Script Pattern
 *
 * FLUXO DE DADOS:
 * Controller → Service → Repository → Database
 *     ↓          ↓          ↓            ↓
 *  Validação  Negócio   Query SQL    Datasul
 *
 * =============================================================================
 */
export class InformacoesGeraisService {

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: getInformacoesGerais
   * ---------------------------------------------------------------------------
   *
   * Busca informações completas de uma família, incluindo dados mestres e
   * informações de todos os estabelecimentos onde a família está cadastrada.
   *
   * @description
   * Método principal do Service que orquestra a busca de dados de uma família.
   * Realiza uma única consulta ao banco de dados:
   * 1. Busca dados mestres da família (código, descrição)
   *
   * Após obter os dados, aplica transformações de negócio e retorna
   * um DTO padronizado para o Controller.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Busca dados mestres da família via Repository
   * 2. Verifica se familia existe (lança FamiliaNotFoundError se não)
   * 3. Monta objeto de resposta com dados transformados
   * 4. Retorna DTO completo
   *
   * REGRAS DE NEGÓCIO:
   *
   * TRATAMENTO DE ERROS:
   * - FamiliaNotFoundError: Re-lançado sem alteração
   * - Outros erros: Convertidos para DatabaseError com contexto
   *
   * PONTOS CRÍTICOS:
   * - Logging de erro inclui familiaCodigo para rastreabilidade
   * - Preserva stack trace original ao converter erros
   *
   * @async
   * @static
   * @method getInformacoesGerais
   *
   * @param {string} familiaCodigo - Código único da família no sistema Datasul
   *
   * @returns {Promise<FamiliaInformacoesGerais>} DTO com informações completas da família:
   * @returns {string} identificacaoFamiliaCodigo - Código da família
   * @returns {string} identificacaoFamiliaDescricao - Descrição completa da família
   *
   * @throws {FamiliaNotFoundError}
   * Quando a família não existe no banco de dados.
   * - statusCode: 404
   * - Ocorre se getFamiliaMaster retornar null/undefined
   *
   * @throws {DatabaseError}
   * Quando ocorre erro técnico no acesso ao banco de dados.
   * - statusCode: 500
   * - Ocorre em: timeout, conexão perdida, SQL inválido, etc
   * - Inclui erro original como causa
   *
   * @example
   * // Caso de sucesso
   * const result = await InformacoesGeraisService.getInformacoesGerais('450000');
   * // Retorna:
   * {
   *   identificacaoFamiliaCodigo: '7530110',
   *   identificacaoFamiliaDescricao: 'FAMÍLIA TESTE',
   * }
   *
   * @example
   * // Caso de erro - Família não encontrada
   * try {
   *   await InformacoesGeraisService.getInformacoesGerais('INVALID');
   * } catch (error) {
   *   console.log(error.name);    // 'FamiliaNotFoundError'
   *   console.log(error.message); // 'Família INVALID não encontrado'
   *   console.log(error.statusCode); // 404
   * }
   *
   * @example
   * // Caso de erro - Erro de banco de dados
   * try {
   *   await InformacoesGeraisService.getInformacoesGerais('450000');
   * } catch (error) {
   *   console.log(error.name);    // 'DatabaseError'
   *   console.log(error.message); // 'Falha ao buscar informações da família'
   *   console.log(error.statusCode); // 500
   *   console.log(error.cause);   // Erro original do banco
   * }
   *
   * @see {@link FamiliaInformacoesGeraisRepository.getFamiliaMaster}
   * @see {@link FamiliaNotFoundError}
   * @see {@link DatabaseError}
   */
  static async getInformacoesGerais(familiaCodigo: string): Promise<any | null> {
    try {
      // ---------------------------------------------------------------------------
      // ETAPA 1: Buscar Dados Mestres da Família
      // ---------------------------------------------------------------------------
      // Consulta tabela pub.familia via OPENQUERY
      // Retorna: familiaCodigo, familiaDescricao
      // Retorna null se familia não existir
      const familiaData = await FamiliaInformacoesGeraisRepository.getFamiliaMaster(familiaCodigo);

      // ---------------------------------------------------------------------------
      // ETAPA 2: Verificar Existência da Família
      // ---------------------------------------------------------------------------
      // Se família não foi encontrada, registra log e lança erro específico
      // IMPORTANTE: Não busca estabelecimentos se item não existir (early return)
      if (!familiaData) {
        log.info('Família não encontrada', { familiaCodigo });
        throw new FamiliaNotFoundError(familiaCodigo);
      }

      // ---------------------------------------------------------------------------
      // ETAPA 3: Montar DTO de Resposta
      // ---------------------------------------------------------------------------
      // Transforma dados brutos do banco em formato padronizado
      // Aplica regras de negócio no mapeamento
      const response = {
        // Dados mestres da família (tabela pub.familia)
        identificacaoFamiliaCodigo: familiaData.familiaCodigo,
        identificacaoFamiliaDescricao: familiaData.familiaDescricao,

      };

      // ---------------------------------------------------------------------------
      // ETAPA 4: Retornar Resposta
      // ---------------------------------------------------------------------------
      return response;

    } catch (error) {
      // ---------------------------------------------------------------------------
      // TRATAMENTO DE ERROS
      // ---------------------------------------------------------------------------

      // ---------------------------------------------------------------------------
      // CASO 1: Erro de Família Não Encontrada
      // ---------------------------------------------------------------------------
      // Se já é FamiliaNotFoundError, re-lança sem alteração
      // Preserva statusCode 404 e mensagem original
      if (error instanceof FamiliaNotFoundError) {
        throw error;
      }

      // ---------------------------------------------------------------------------
      // CASO 2: Erro de Banco de Dados ou Desconhecido
      // ---------------------------------------------------------------------------
      // Converte qualquer outro erro para DatabaseError
      // Adiciona contexto (familiaCodigo) e preserva erro original

      // Registra erro detalhado no log
      log.error('Erro ao buscar informações gerais', {
        familiaCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      // Lança DatabaseError com mensagem amigável e erro original como causa
      throw new DatabaseError(
        'Falha ao buscar informações da família',
        error instanceof Error ? error : undefined
      );
    }
  }
}