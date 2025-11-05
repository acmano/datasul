/**
 * Tópico: Aba Onde Usado (Where Used)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const tabOndeUsado: HelpTopicContent = {
  key: 'tab-onde-usado',
  title: 'Aba: Onde Usado (Where Used)',
  content: (
    <div>
      <Paragraph>
        A aba <Text strong>Onde Usado</Text> apresenta uma consulta inversa da estrutura, mostrando
        em quais produtos (pais) um determinado componente (filho) é utilizado. Esta visualização
        permite rastrear a aplicação de um item através de toda a hierarquia de produtos.
      </Paragraph>

      <Title level={4}>O que é Onde Usado?</Title>
      <Paragraph>
        Enquanto a estrutura de produtos mostra os componentes que formam um produto (hierarquia
        descendente), o Onde Usado mostra o caminho inverso: dado um componente, em quais produtos
        ele é utilizado (hierarquia ascendente).
      </Paragraph>

      <Title level={4}>Exemplo Prático</Title>
      <Paragraph>
        <Text strong>Estrutura (descendente):</Text>
        <br />
        Bicicleta → Roda → Aro → Raio
      </Paragraph>
      <Paragraph>
        <Text strong>Onde Usado (ascendente):</Text>
        <br />
        Raio → Aro → Roda → Bicicleta
      </Paragraph>
      <Paragraph>
        Se você consultar "Onde Usado" do item "Raio", verá que ele é usado no "Aro", que por sua
        vez é usado na "Roda", que é usada na "Bicicleta".
      </Paragraph>

      <Title level={4}>Informações Exibidas</Title>
      <ul>
        <li>Produtos pais que utilizam o componente selecionado</li>
        <li>Quantidades em que o componente é usado em cada produto pai</li>
        <li>Níveis hierárquicos invertidos (do filho para os pais)</li>
        <li>Processos de fabricação associados aos produtos pais</li>
        <li>Estrutura multinível completa de onde-usado</li>
      </ul>

      <Title level={4}>Visualizações Disponíveis</Title>
      <Paragraph>
        Assim como na aba Estrutura, o Onde Usado oferece múltiplas visualizações para facilitar a
        análise:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Tabela Hierárquica:</Text> Visualização em formato de tabela com níveis
          expandíveis
        </li>
        <li>
          <Text strong>Sankey:</Text> Diagrama de fluxo mostrando as relações e quantidades (fluxo
          invertido)
        </li>
        <li>
          <Text strong>Árvore:</Text> Visualização em árvore hierárquica (orientação invertida)
        </li>
        <li>
          <Text strong>Treemap:</Text> Mapa de calor proporcional às quantidades
        </li>
        <li>
          <Text strong>Grafo:</Text> Rede de relacionamentos entre itens
        </li>
      </ul>

      <Title level={4}>Exportação e Impressão</Title>
      <Paragraph>
        Todas as visualizações de Onde Usado suportam exportação nos mesmos formatos da Estrutura:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Tabela:</Text> CSV, Excel (XLSX), PDF e Impressão
        </li>
        <li>
          <Text strong>Gráficos:</Text> PDF e Impressão
        </li>
      </ul>
      <Paragraph>
        Os arquivos exportados incluem automaticamente o código do item e timestamp no nome,
        facilitando a organização e rastreabilidade. Exemplo:{' '}
        <Text code>onde_usado_ITEM123_2025-10-23T14-30-00.csv</Text>
      </Paragraph>

      <Title level={4}>Controles de Visualização</Title>
      <Paragraph>O Onde Usado compartilha os mesmos controles da aba Estrutura:</Paragraph>
      <ul>
        <li>
          <Text strong>Data de Referência:</Text> Consulta a estrutura válida em uma data específica
        </li>
        <li>
          <Text strong>Mostrar Histórico:</Text> Exibe componentes fora de validade em cinza
        </li>
        <li>
          <Text strong>Tipo de Estrutura:</Text>
          <ul>
            <li>Engenharia: Quantidades conforme cadastrado</li>
            <li>Consumo: Quantidades multiplicadas por um fator</li>
          </ul>
        </li>
        <li>
          <Text strong>Modo de Apresentação:</Text>
          <ul>
            <li>Estrutura: Visualização hierárquica</li>
            <li>Lista: Lista sumarizada (modo consumo)</li>
          </ul>
        </li>
      </ul>

      <Title level={4}>Casos de Uso</Title>
      <ul>
        <li>
          <Text strong>Análise de Impacto:</Text> Identificar quais produtos serão afetados por
          mudança em um componente
        </li>
        <li>
          <Text strong>Obsolescência:</Text> Verificar onde um item obsoleto ainda é usado
        </li>
        <li>
          <Text strong>Padronização:</Text> Encontrar oportunidades de consolidação de componentes
        </li>
        <li>
          <Text strong>Custos:</Text> Analisar impacto de mudança de custo em componentes
        </li>
        <li>
          <Text strong>Planejamento:</Text> Entender demanda dependente de um componente
        </li>
      </ul>

      <Title level={4}>Navegação e Drill-Down</Title>
      <Paragraph>
        Você pode navegar pela hierarquia de Onde Usado clicando em qualquer produto pai para ver
        sua própria estrutura de onde-usado. O breadcrumb no topo permite voltar facilmente aos
        níveis anteriores.
      </Paragraph>

      <Title level={4}>Diferenças vs. Estrutura</Title>
      <Paragraph>
        <Text strong>Estrutura:</Text> "O que compõe este produto?" (pai → filhos)
        <br />
        <Text strong>Onde Usado:</Text> "Onde este componente é usado?" (filho → pais)
      </Paragraph>
      <Paragraph>
        Ambas as abas compartilham as mesmas visualizações e controles, apenas com a direção da
        hierarquia invertida.
      </Paragraph>

      <Paragraph>
        Atalho: <Text keyboard>Alt+3</Text>
      </Paragraph>
    </div>
  ),
  keywords: [
    'onde usado',
    'where used',
    'consulta inversa',
    'produtos pais',
    'rastreabilidade',
    'impacto',
    'utilização',
    'aplicação',
  ],
};
