/**
 * Tópico: Tipos de Visualização de Onde Usado
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const visualizacoesOndeUsado: HelpTopicContent = {
  key: 'onde-usado-visualizacoes',
  title: 'Tipos de Visualização de Onde Usado',
  content: (
    <div>
      <Paragraph>
        O módulo de Onde Usado oferece 5 tipos diferentes de visualização para rastrear em quais
        produtos um componente é utilizado. Cada visualização apresenta o fluxo ascendente
        (componente → produtos pais) de forma otimizada para diferentes tipos de análise.
      </Paragraph>

      <Title level={4}>1. Tabela Hierárquica Ascendente</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para análise detalhada de onde-usado, exportação de dados
        ou quando precisa ver informações tabulares de todos os produtos pais.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>
          Visualização tabular com colunas: Nível, Código, Descrição, Quantidade, UN, Processo
        </li>
        <li>
          Nível 0 = componente consultado (raiz), níveis maiores = produtos pais mais complexos
        </li>
        <li>Expansão/colapso por níveis usando slider</li>
        <li>Indicador visual de níveis com barras coloridas ascendentes</li>
        <li>Expansão inline de detalhes do processo de fabricação dos produtos pais</li>
        <li>Virtualização para alta performance (suporta milhares de onde-usado)</li>
        <li>Exportação específica: arquivos incluem "onde_usado" no nome</li>
      </ul>
      <Paragraph>
        <Text strong>Diferença da Estrutura:</Text> A hierarquia é invertida - você vê o componente
        na raiz e seus produtos pais nos níveis superiores, ao invés de ver o produto final na raiz
        e seus componentes nos níveis inferiores.
      </Paragraph>
      <Paragraph>
        <Text strong>Dica:</Text> Use a tabela para análise de impacto - exporte para Excel e filtre
        produtos pais específicos para análise detalhada.
      </Paragraph>

      <Title level={4}>2. Diagrama Sankey Invertido</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para visualizar rapidamente o fluxo ascendente de uso e
        entender proporções de consumo em diferentes produtos.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>
          Diagrama de fluxo <Text strong>invertido</Text> (direita para esquerda ou vertical
          ascendente)
        </li>
        <li>Componente consultado aparece à direita/embaixo</li>
        <li>Produtos pais aparecem à esquerda/em cima</li>
        <li>Largura dos fluxos proporcional às quantidades usadas</li>
        <li>Cores em degradê por nível ascendente</li>
        <li>Exibição opcional de quantidades nos fluxos</li>
        <li>Altura dinâmica baseada no número de produtos pais</li>
        <li>Scroll vertical para componentes muito utilizados</li>
      </ul>
      <Paragraph>
        <Text strong>Diferença da Estrutura:</Text> O fluxo é invertido - mostra como o componente
        "sobe" na estrutura até os produtos finais, ao invés de mostrar como o produto "desce" até
        os componentes básicos.
      </Paragraph>
      <Paragraph>
        <Text strong>Dica:</Text> Ideal para apresentações sobre impacto de mudanças - mostra
        visualmente todos os produtos afetados e as quantidades.
      </Paragraph>

      <Title level={4}>3. Árvore Ascendente</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para visão hierárquica clara de todos os níveis de
        onde-usado, especialmente útil para componentes usados em múltiplos produtos.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Três orientações disponíveis: Vertical, Horizontal e Radial</li>
        <li>
          <Text strong>Vertical Invertida:</Text> Componente na base, produtos pais crescendo para
          cima
        </li>
        <li>
          <Text strong>Horizontal Invertida:</Text> Componente à direita, produtos pais à esquerda
        </li>
        <li>
          <Text strong>Radial:</Text> Componente no centro, produtos pais em círculo (ideal para
          componentes com muitos usos)
        </li>
        <li>Expansão/colapso de ramos para focar em produtos específicos</li>
        <li>Cores em degradê por nível ascendente</li>
        <li>Labels com código e quantidade opcional</li>
      </ul>
      <Paragraph>
        <Text strong>Diferença da Estrutura:</Text> A raiz representa o componente consultado, e os
        ramos crescem em direção aos produtos finais, invertendo a árvore tradicional.
      </Paragraph>
      <Paragraph>
        <Text strong>Dica:</Text> Use árvore radial para componentes muito utilizados (como
        parafusos, arruelas) - facilita visualização de múltiplos usos sem overlaps.
      </Paragraph>

      <Title level={4}>4. Treemap de Onde Usado</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para visualizar proporções de uso em espaço compacto,
        identificar rapidamente quais produtos consomem mais do componente.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Visualização hierárquica em blocos retangulares aninhados</li>
        <li>Tamanho dos blocos proporcional às quantidades usadas</li>
        <li>Blocos maiores = produtos que consomem mais do componente</li>
        <li>Cores em degradê por nível ascendente</li>
        <li>Labels com código e quantidade</li>
        <li>Navegação por clique nos blocos (drill-down para onde-usado do produto pai)</li>
        <li>Breadcrumb mostrando o caminho de navegação</li>
      </ul>
      <Paragraph>
        <Text strong>Diferença da Estrutura:</Text> Os blocos representam produtos que usam o
        componente, não componentes que formam o produto.
      </Paragraph>
      <Paragraph>
        <Text strong>Dica:</Text> Excelente para análise de custo - identifique visualmente quais
        produtos serão mais impactados por mudança de preço do componente.
      </Paragraph>

      <Title level={4}>5. Grafo de Onde Usado</Title>
      <Paragraph>
        <Text strong>Quando usar:</Text> Para análise de dependências complexas, identificar
        múltiplos caminhos de onde-usado e gargalos na cadeia de produtos.
      </Paragraph>
      <Paragraph>
        <Text strong>Características:</Text>
      </Paragraph>
      <ul>
        <li>Dois layouts disponíveis: Força (dinâmico) e Circular (organizado)</li>
        <li>
          <Text strong>Layout Força:</Text> Simulação física que organiza automaticamente os nós
          (componente no centro, produtos pais ao redor)
        </li>
        <li>
          <Text strong>Layout Circular:</Text> Componente no centro, produtos pais em círculo para
          melhor legibilidade
        </li>
        <li>Filtro de profundidade para simplificar visualização de cadeias longas</li>
        <li>Busca de produtos específicos com highlight visual</li>
        <li>Nós arrastáveis para reorganização manual</li>
        <li>Destaque de caminhos ao passar o mouse (mostra cadeia completa de onde-usado)</li>
        <li>Identificação de múltiplos usos do mesmo componente em uma cadeia</li>
      </ul>
      <Paragraph>
        <Text strong>Diferença da Estrutura:</Text> Os nós representam produtos pais e as conexões
        mostram relações de "usado em", ao invés de relações de "composto por".
      </Paragraph>
      <Paragraph>
        <Text strong>Dica:</Text> Use para identificar produtos finais - componentes sem conexões de
        saída são produtos finais que não são usados em outros produtos.
      </Paragraph>

      <Title level={4}>Escolhendo a Visualização Adequada</Title>
      <ul>
        <li>
          <Text strong>Análise Detalhada e Exportação:</Text> Use Tabela
        </li>
        <li>
          <Text strong>Apresentação de Impacto:</Text> Use Sankey (mostra fluxo visual claro)
        </li>
        <li>
          <Text strong>Componentes com Poucos Usos (1-10):</Text> Use Árvore Vertical ou Horizontal
        </li>
        <li>
          <Text strong>Componentes com Muitos Usos (&gt;10):</Text> Use Árvore Radial ou Grafo
          Circular
        </li>
        <li>
          <Text strong>Análise de Proporções de Uso:</Text> Use Treemap
        </li>
        <li>
          <Text strong>Identificar Caminhos e Produtos Finais:</Text> Use Grafo
        </li>
        <li>
          <Text strong>Documentação de Mudanças:</Text> Use Tabela + Sankey (combine ambos na
          documentação)
        </li>
      </ul>

      <Title level={4}>Interpretação dos Níveis</Title>
      <Paragraph>
        <Text strong>Importante:</Text> A interpretação de níveis no Onde Usado é invertida:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Nível 0:</Text> Componente consultado (raiz da consulta)
        </li>
        <li>
          <Text strong>Nível 1:</Text> Produtos que usam diretamente o componente
        </li>
        <li>
          <Text strong>Nível 2:</Text> Produtos que usam os produtos de nível 1
        </li>
        <li>
          <Text strong>Nível N:</Text> Produtos finais (não são usados em outros produtos)
        </li>
      </ul>

      <Title level={4}>Dicas por Tipo de Análise</Title>
      <Paragraph>
        <Text strong>Análise de Obsolescência:</Text>
      </Paragraph>
      <ul>
        <li>Use Tabela para exportar lista completa de produtos afetados</li>
        <li>Use Treemap para priorizar substituição (comece pelos maiores blocos)</li>
      </ul>

      <Paragraph>
        <Text strong>Análise de Custo:</Text>
      </Paragraph>
      <ul>
        <li>Use Sankey para visualizar impacto em quantidades</li>
        <li>Use Treemap para identificar produtos mais impactados</li>
      </ul>

      <Paragraph>
        <Text strong>Padronização:</Text>
      </Paragraph>
      <ul>
        <li>Use Grafo para identificar padrões de uso similares</li>
        <li>Compare onde-usado de componentes similares lado a lado</li>
      </ul>

      <Paragraph>
        <Text strong>Comunicação com Stakeholders:</Text>
      </Paragraph>
      <ul>
        <li>Use Sankey ou Árvore Radial para apresentações visuais impactantes</li>
        <li>Exporte como PDF para documentação</li>
      </ul>

      <Title level={4}>Performance e Limitações</Title>
      <ul>
        <li>Tabela: Suporta milhares de linhas com virtualização (sem limite prático)</li>
        <li>
          Sankey: Melhor performance até ~500 nós (use filtro de profundidade para estruturas
          maiores)
        </li>
        <li>Árvore: Até ~1000 nós (radial suporta mais que vertical/horizontal)</li>
        <li>Treemap: Até ~2000 blocos</li>
        <li>
          Grafo: Melhor até ~200 nós (use filtro de profundidade e busca para estruturas maiores)
        </li>
      </ul>

      <Title level={4}>Combinando Visualizações</Title>
      <Paragraph>Para análise completa, recomenda-se usar múltiplas visualizações:</Paragraph>
      <ul>
        <li>Comece com Tabela para visão geral e números exatos</li>
        <li>Use Sankey para entender fluxo e proporções</li>
        <li>Use Grafo para identificar produtos finais e caminhos críticos</li>
        <li>Exporte tudo para documentação completa</li>
      </ul>
    </div>
  ),
  keywords: [
    'visualização',
    'onde usado',
    'tabela',
    'sankey',
    'árvore',
    'treemap',
    'grafo',
    'fluxo invertido',
    'ascendente',
    'produtos pais',
  ],
};
