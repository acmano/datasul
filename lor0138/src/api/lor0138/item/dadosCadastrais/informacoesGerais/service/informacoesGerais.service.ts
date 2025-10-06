// src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { ItemInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, ItemNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * =============================================================================
 * SERVICE - INFORMAÇÕES GERAIS DO ITEM
 * =============================================================================
 *
 * Camada de lógica de negócio para operações relacionadas às informações
 * gerais de itens do sistema Datasul.
 *
 * @module InformacoesGeraisService
 * @category Services
 * @subcategory Item/DadosCadastrais
 *
 * RESPONSABILIDADES:
 * - Orquestrar chamadas ao Repository (master + estabelecimentos)
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
   * Busca informações completas de um item, incluindo dados mestres e
   * informações de todos os estabelecimentos onde o item está cadastrado.
   *
   * @description
   * Método principal do Service que orquestra a busca de dados de um item.
   * Realiza duas consultas sequenciais ao banco de dados:
   * 1. Busca dados mestres do item (código, descrição, unidade)
   * 2. Busca estabelecimentos relacionados ao item
   *
   * Após obter os dados, aplica transformações de negócio e retorna
   * um DTO padronizado para o Controller.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Busca dados mestres do item via Repository
   * 2. Verifica se item existe (lança ItemNotFoundError se não)
   * 3. Busca estabelecimentos do item via Repository
   * 4. Mapeia statusIndex dos estabelecimentos (0 → 1, outros → 2)
   * 5. Monta objeto de resposta com dados transformados
   * 6. Retorna DTO completo
   *
   * REGRAS DE NEGÓCIO:
   * - codObsoleto === 0: Item ativo no estabelecimento (statusIndex = 1)
   * - codObsoleto !== 0: Item obsoleto/inativo (statusIndex = 2)
   *
   * TRATAMENTO DE ERROS:
   * - ItemNotFoundError: Re-lançado sem alteração
   * - Outros erros: Convertidos para DatabaseError com contexto
   *
   * PONTOS CRÍTICOS:
   * - Busca estabelecimentos apenas se item existir (early return)
   * - Logging de erro inclui itemCodigo para rastreabilidade
   * - Preserva stack trace original ao converter erros
   * - Retorna array vazio se item não tiver estabelecimentos
   *
   * @async
   * @static
   * @method getInformacoesGerais
   *
   * @param {string} itemCodigo - Código único do item no sistema Datasul
   *
   * @returns {Promise<ItemInformacoesGerais>} DTO com informações completas do item:
   * @returns {string} identificacaoItemCodigo - Código do item
   * @returns {string} identificacaoItemDescricao - Descrição completa do item
   * @returns {string} identificacaoItemUnidade - Unidade de medida (UN, KG, etc)
   * @returns {Array<ItemInformacoesGeraisEstabelecimento>} identificacaoItensEstabelecimentos - Lista de estabelecimentos
   *
   * @throws {ItemNotFoundError}
   * Quando o item não existe no banco de dados.
   * - statusCode: 404
   * - Ocorre se getItemMaster retornar null/undefined
   *
   * @throws {DatabaseError}
   * Quando ocorre erro técnico no acesso ao banco de dados.
   * - statusCode: 500
   * - Ocorre em: timeout, conexão perdida, SQL inválido, etc
   * - Inclui erro original como causa
   *
   * @example
   * // Caso de sucesso - Item com estabelecimentos
   * const result = await InformacoesGeraisService.getInformacoesGerais('7530110');
   * // Retorna:
   * {
   *   identificacaoItemCodigo: '7530110',
   *   identificacaoItemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
   *   identificacaoItemUnidade: 'UN',
   *   identificacaoItensEstabelecimentos: [
   *     {
   *       itemCodigo: '7530110',
   *       estabCodigo: '01.01',
   *       estabNome: 'CD São Paulo',
   *       statusIndex: 1  // Ativo (codObsoleto = 0)
   *     },
   *     {
   *       itemCodigo: '7530110',
   *       estabCodigo: '02.01',
   *       estabNome: 'Fábrica Joinville',
   *       statusIndex: 2  // Obsoleto (codObsoleto = 1)
   *     }
   *   ]
   * }
   *
   * @example
   * // Caso de sucesso - Item sem estabelecimentos
   * const result = await InformacoesGeraisService.getInformacoesGerais('ABC123');
   * // Retorna:
   * {
   *   identificacaoItemCodigo: 'ABC123',
   *   identificacaoItemDescricao: 'Item Teste',
   *   identificacaoItemUnidade: 'UN',
   *   identificacaoItensEstabelecimentos: []  // Array vazio
   * }
   *
   * @example
   * // Caso de erro - Item não encontrado
   * try {
   *   await InformacoesGeraisService.getInformacoesGerais('INVALID');
   * } catch (error) {
   *   console.log(error.name);    // 'ItemNotFoundError'
   *   console.log(error.message); // 'Item INVALID não encontrado'
   *   console.log(error.statusCode); // 404
   * }
   *
   * @example
   * // Caso de erro - Erro de banco de dados
   * try {
   *   await InformacoesGeraisService.getInformacoesGerais('7530110');
   * } catch (error) {
   *   console.log(error.name);    // 'DatabaseError'
   *   console.log(error.message); // 'Falha ao buscar informações do item'
   *   console.log(error.statusCode); // 500
   *   console.log(error.cause);   // Erro original do banco
   * }
   *
   * @see {@link ItemInformacoesGeraisRepository.getItemMaster}
   * @see {@link ItemInformacoesGeraisRepository.getItemEstabelecimentos}
   * @see {@link ItemNotFoundError}
   * @see {@link DatabaseError}
   */
  static async getInformacoesGerais(itemCodigo: string): Promise<any | null> {
    try {
      // ---------------------------------------------------------------------------
      // ETAPA 1: Buscar Dados Mestres do Item
      // ---------------------------------------------------------------------------
      // Consulta tabela pub.item via OPENQUERY
      // Retorna: itemCodigo, itemDescricao, itemUnidade
      // Retorna null se item não existir
      const itemData = await ItemInformacoesGeraisRepository.getItemMaster(itemCodigo);

      // ---------------------------------------------------------------------------
      // ETAPA 2: Verificar Existência do Item
      // ---------------------------------------------------------------------------
      // Se item não foi encontrado, registra log e lança erro específico
      // IMPORTANTE: Não busca estabelecimentos se item não existir (early return)
      if (!itemData) {
        log.info('Item não encontrado', { itemCodigo });
        throw new ItemNotFoundError(itemCodigo);
      }

      // ---------------------------------------------------------------------------
      // ETAPA 3: Buscar Estabelecimentos do Item
      // ---------------------------------------------------------------------------
      // Consulta tabelas pub.item-uni-estab e pub.estabelec via OPENQUERY
      // Retorna array (vazio se item não tiver estabelecimentos)
      // Inclui: itemCodigo, estabCodigo, estabNome, codObsoleto
      const estabelecimentos = await ItemInformacoesGeraisRepository.getItemEstabelecimentos(itemCodigo);

      // ---------------------------------------------------------------------------
      // ETAPA 4: Montar DTO de Resposta
      // ---------------------------------------------------------------------------
      // Transforma dados brutos do banco em formato padronizado
      // Aplica regras de negócio no mapeamento
      const response = {
        // Dados mestres do item (tabela pub.item)
        identificacaoItemCodigo: itemData.itemCodigo,
        identificacaoItemDescricao: itemData.itemDescricao,
        identificacaoItemUnidade: itemData.itemUnidade,

        // Lista de estabelecimentos com transformação de statusIndex
        identificacaoItensEstabelecimentos: estabelecimentos.map(estab => ({
          // Código do item (redundante, mas mantido por padrão)
          itemCodigo: estab.itemCodigo,

          // Código do estabelecimento (ex: "01.01")
          estabCodigo: estab.estabCodigo,

          // Nome do estabelecimento (ex: "CD São Paulo")
          estabNome: estab.estabNome,

          // ---------------------------------------------------------------------------
          // REGRA DE NEGÓCIO: Mapeamento de Status
          // ---------------------------------------------------------------------------
          // codObsoleto = 0 → statusIndex = 1 (Item ativo no estabelecimento)
          // codObsoleto ≠ 0 → statusIndex = 2 (Item obsoleto/inativo)
          //
          // IMPORTANTE: Lógica booleana estrita para evitar bugs
          // Usa === 0 ao invés de !codObsoleto para clareza
          statusIndex: estab.codObsoleto === 0 ? 1 : 2,
        })),
      };

      // ---------------------------------------------------------------------------
      // ETAPA 5: Retornar Resposta
      // ---------------------------------------------------------------------------
      return response;

    } catch (error) {
      // ---------------------------------------------------------------------------
      // TRATAMENTO DE ERROS
      // ---------------------------------------------------------------------------

      // ---------------------------------------------------------------------------
      // CASO 1: Erro de Item Não Encontrado
      // ---------------------------------------------------------------------------
      // Se já é ItemNotFoundError, re-lança sem alteração
      // Preserva statusCode 404 e mensagem original
      if (error instanceof ItemNotFoundError) {
        throw error;
      }

      // ---------------------------------------------------------------------------
      // CASO 2: Erro de Banco de Dados ou Desconhecido
      // ---------------------------------------------------------------------------
      // Converte qualquer outro erro para DatabaseError
      // Adiciona contexto (itemCodigo) e preserva erro original

      // Registra erro detalhado no log
      log.error('Erro ao buscar informações gerais', {
        itemCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      // Lança DatabaseError com mensagem amigável e erro original como causa
      throw new DatabaseError(
        'Falha ao buscar informações do item',
        error instanceof Error ? error : undefined
      );
    }
  }
}