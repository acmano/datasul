/**
 * Sistema de Ajuda - Exportações Centralizadas
 * Este arquivo importa e exporta todos os tópicos, índice e mapeamentos
 */

import type { HelpTopicContent } from '../types/help.types';

// Importar tópicos principais
import { sobre } from './topics/sobre';

// Importar tópicos "Como Usar"
import { pesquisa } from './topics/comoUsar/pesquisa';
import { caracteresCuringa } from './topics/comoUsar/caracteresCuringa';
import { buscaPorGtin } from './topics/comoUsar/buscaPorGtin';
import { navegacaoTabs } from './topics/comoUsar/navegacaoTabs';
import { controlesInterface } from './topics/comoUsar/controlesInterface';
import { exportacao } from './topics/comoUsar/exportacao';
import { exportacaoCatalogo } from './topics/comoUsar/exportacaoCatalogo';
import { exportacaoAvancada } from './topics/comoUsar/exportacaoAvancada';
import { atalhos } from './topics/comoUsar/atalhos';

// Importar tópicos "Módulos"
import { dadosMestres } from './topics/modulos/dadosMestres';
import { tabResultado } from './topics/modulos/dadosMestres/tabResultado';
import { tabBase } from './topics/modulos/dadosMestres/tabBase';
import { tabDimensoes } from './topics/modulos/dadosMestres/tabDimensoes';
import { tabSuprimentos } from './topics/modulos/dadosMestres/tabSuprimentos';

// Importar tópicos "PCP"
import { pcp } from './topics/modulos/pcp';
import { tabResultadoPcp } from './topics/modulos/pcp/tabResultado';
import { tabBasePcp } from './topics/modulos/pcp/tabBase';

// Importar tópicos "Manufatura"
import { manufatura } from './topics/modulos/manufatura';
import { tabResultadoManufatura } from './topics/modulos/manufatura/tabResultado';
import { tabBaseManufatura } from './topics/modulos/manufatura/tabBase';

// Importar tópicos "Fiscal"
import { fiscal } from './topics/modulos/fiscal';
import { tabResultadoFiscal } from './topics/modulos/fiscal/tabResultado';
import { tabBaseFiscal } from './topics/modulos/fiscal/tabBase';

// Importar tópicos "Engenharia"
import { engenharia } from './topics/modulos/engenharia';
import { tabResultadoEngenharia } from './topics/modulos/engenharia/tabResultado';
import { tabEstrutura } from './topics/modulos/engenharia/tabEstrutura';
import { tabOndeUsado } from './topics/modulos/engenharia/tabOndeUsado';
import { estrutura } from './topics/modulos/engenharia/estrutura';
import { visualizacoes } from './topics/modulos/engenharia/estrutura/visualizacoes';
import { controles } from './topics/modulos/engenharia/estrutura/controles';
import { drilldown } from './topics/modulos/engenharia/estrutura/drilldown';
import { exportacao as exportacaoEstrutura } from './topics/modulos/engenharia/estrutura/exportacao';
import { ondeUsado } from './topics/modulos/engenharia/ondeUsado';
import { visualizacoesOndeUsado } from './topics/modulos/engenharia/ondeUsado/visualizacoes';
import { controlesOndeUsado } from './topics/modulos/engenharia/ondeUsado/controles';
import { drilldownOndeUsado } from './topics/modulos/engenharia/ondeUsado/drilldown';

// Importar capítulos customizáveis
import { capitulo1 } from './topics/capitulos/capitulo1';
import { capitulo2 } from './topics/capitulos/capitulo2';

// Exportar índice e mapeamentos
export { helpIndex } from './helpIndex';
export { contextMappings, getTopicKeyByContext, flattenHelpIndex } from './contextMappings';

/**
 * Registro de todos os tópicos de ajuda
 * Cada tópico é identificado por sua chave única
 */
export const helpTopics: Record<string, HelpTopicContent> = {
  // Tópico principal
  [sobre.key]: sobre,

  // Como Usar
  [pesquisa.key]: pesquisa,
  [caracteresCuringa.key]: caracteresCuringa,
  [buscaPorGtin.key]: buscaPorGtin,
  [navegacaoTabs.key]: navegacaoTabs,
  [controlesInterface.key]: controlesInterface,
  [exportacao.key]: exportacao,
  [exportacaoCatalogo.key]: exportacaoCatalogo,
  [exportacaoAvancada.key]: exportacaoAvancada,
  [atalhos.key]: atalhos,

  // Módulos - Dados Mestres
  [dadosMestres.key]: dadosMestres,
  [tabResultado.key]: tabResultado,
  [tabBase.key]: tabBase,
  [tabDimensoes.key]: tabDimensoes,
  [tabSuprimentos.key]: tabSuprimentos,

  // Módulos - PCP
  [pcp.key]: pcp,
  [tabResultadoPcp.key]: tabResultadoPcp,
  [tabBasePcp.key]: tabBasePcp,

  // Módulos - Manufatura
  [manufatura.key]: manufatura,
  [tabResultadoManufatura.key]: tabResultadoManufatura,
  [tabBaseManufatura.key]: tabBaseManufatura,

  // Módulos - Fiscal
  [fiscal.key]: fiscal,
  [tabResultadoFiscal.key]: tabResultadoFiscal,
  [tabBaseFiscal.key]: tabBaseFiscal,

  // Módulos - Engenharia
  [engenharia.key]: engenharia,
  [tabResultadoEngenharia.key]: tabResultadoEngenharia,
  [tabEstrutura.key]: tabEstrutura,
  [tabOndeUsado.key]: tabOndeUsado,
  [estrutura.key]: estrutura,
  [visualizacoes.key]: visualizacoes,
  [controles.key]: controles,
  [drilldown.key]: drilldown,
  [exportacaoEstrutura.key]: exportacaoEstrutura,
  [ondeUsado.key]: ondeUsado,
  [visualizacoesOndeUsado.key]: visualizacoesOndeUsado,
  [controlesOndeUsado.key]: controlesOndeUsado,
  [drilldownOndeUsado.key]: drilldownOndeUsado,

  // Capítulos Customizáveis
  [capitulo1.key]: capitulo1,
  [capitulo2.key]: capitulo2,
};
