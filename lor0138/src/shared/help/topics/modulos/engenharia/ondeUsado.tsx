/**
 * Tópico: Onde Usado (Where Used)
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const ondeUsado: HelpTopicContent = {
  key: 'onde-usado',
  title: 'Onde Usado (Where Used)',
  content: (
    <div>
      <Paragraph>
        O módulo de <Text strong>Onde Usado</Text> (Where Used) permite rastrear em quais produtos
        um determinado componente é utilizado, oferecendo uma visão inversa da estrutura de
        produtos. Esta funcionalidade é essencial para análise de impacto, gestão de mudanças e
        planejamento estratégico.
      </Paragraph>

      <Title level={4}>Visão Geral</Title>
      <Paragraph>
        Enquanto a Estrutura de Produtos mostra os componentes que formam um produto (visão
        descendente: pai → filhos), o Onde Usado mostra em quais produtos um componente é utilizado
        (visão ascendente: filho → pais). É como "subir na árvore" ao invés de "descer".
      </Paragraph>

      <Title level={4}>Exemplo Prático</Title>
      <Paragraph>Considere uma estrutura de bicicleta:</Paragraph>
      <Paragraph>
        <Text strong>Estrutura (Descendente):</Text>
        <br />
        Bicicleta → Roda → Aro → Raio
      </Paragraph>
      <Paragraph>
        <Text strong>Onde Usado (Ascendente):</Text>
        <br />
        Raio → usado em → Aro → usado em → Roda → usado em → Bicicleta
      </Paragraph>
      <Paragraph>
        Se você consultar "Onde Usado" do componente "Raio", verá que ele é usado no "Aro" (nível
        1), que por sua vez é usado na "Roda" (nível 2), que finalmente é usada na "Bicicleta"
        (nível 3).
      </Paragraph>

      <Title level={4}>Visualizações Disponíveis</Title>
      <Paragraph>
        O Onde Usado oferece as mesmas 5 visualizações da Estrutura, mas com fluxo invertido:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Tabela:</Text> Visualização tabular hierárquica ascendente
        </li>
        <li>
          <Text strong>Sankey:</Text> Diagrama de fluxo invertido (da direita para esquerda)
        </li>
        <li>
          <Text strong>Árvore:</Text> Representação em árvore com raiz representando o componente
          consultado
        </li>
        <li>
          <Text strong>Treemap:</Text> Visualização hierárquica em blocos proporcionais
        </li>
        <li>
          <Text strong>Grafo:</Text> Grafo de rede mostrando onde o componente é usado
        </li>
      </ul>

      <Title level={4}>Informações Disponíveis</Title>
      <Paragraph>Para cada produto pai que usa o componente, o sistema exibe:</Paragraph>
      <ul>
        <li>Código e descrição do produto pai</li>
        <li>Nível ascendente (0 = componente consultado, 1+ = produtos pais)</li>
        <li>Quantidade em que o componente é usado</li>
        <li>Unidade de medida</li>
        <li>Processo de fabricação do produto pai (quando disponível)</li>
        <li>Operações do processo com tempos e recursos</li>
        <li>Cadeia completa de onde-usado até produtos finais</li>
      </ul>

      <Title level={4}>Casos de Uso</Title>
      <Paragraph>
        <Text strong>1. Análise de Impacto de Mudanças</Text>
      </Paragraph>
      <Paragraph>
        Antes de modificar ou descontinuar um componente, consulte o Onde Usado para identificar
        todos os produtos que serão afetados. Isso permite planejamento adequado e comunicação com
        áreas impactadas.
      </Paragraph>

      <Paragraph>
        <Text strong>2. Gestão de Obsolescência</Text>
      </Paragraph>
      <Paragraph>
        Identifique onde componentes obsoletos ainda são utilizados. Útil para planejamento de
        substituição gradual e gestão de estoque de componentes descontinuados.
      </Paragraph>

      <Paragraph>
        <Text strong>3. Padronização de Componentes</Text>
      </Paragraph>
      <Paragraph>
        Encontre oportunidades de consolidação ao identificar componentes similares usados em
        diferentes produtos. Pode revelar duplicidades e oportunidades de padronização.
      </Paragraph>

      <Paragraph>
        <Text strong>4. Análise de Custo</Text>
      </Paragraph>
      <Paragraph>
        Quando o custo de um componente muda, use o Onde Usado para identificar rapidamente todos os
        produtos cujo custo será impactado e calcular o efeito cascata.
      </Paragraph>

      <Paragraph>
        <Text strong>5. Planejamento de Demanda</Text>
      </Paragraph>
      <Paragraph>
        Entenda a demanda dependente de um componente ao visualizar todos os produtos finais que o
        utilizam. Essencial para planejamento de produção e compras.
      </Paragraph>

      <Title level={4}>Como Usar</Title>
      <Paragraph>
        1. Pesquise um componente na aba <Text strong>Pesquisar</Text>
        <br />
        2. Selecione o item na aba <Text strong>Resultado</Text>
        <br />
        3. Acesse a aba <Text strong>Onde Usado</Text> (Alt+3)
        <br />
        4. Escolha o tipo de visualização mais adequado
        <br />
        5. Use os controles para ajustar cores, zoom e espaçamento
        <br />
        6. Clique em um produto pai para selecioná-lo
        <br />
        7. Dê duplo clique para fazer drill-down (ver onde esse produto pai é usado)
      </Paragraph>

      <Title level={4}>Diferenças vs. Estrutura</Title>
      <Paragraph>
        <Text strong>Direção da Hierarquia:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text strong>Estrutura:</Text> "O que compõe este produto?" (pai → filhos, descendente)
        </li>
        <li>
          <Text strong>Onde Usado:</Text> "Onde este componente é usado?" (filho → pais, ascendente)
        </li>
      </ul>

      <Paragraph>
        <Text strong>Interpretação dos Níveis:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text strong>Estrutura:</Text> Nível 0 = produto final, níveis maiores = componentes mais
          básicos
        </li>
        <li>
          <Text strong>Onde Usado:</Text> Nível 0 = componente consultado, níveis maiores = produtos
          mais complexos
        </li>
      </ul>

      <Paragraph>
        <Text strong>Fluxo nas Visualizações:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text strong>Estrutura:</Text> Sankey flui da esquerda para direita (produto →
          componentes)
        </li>
        <li>
          <Text strong>Onde Usado:</Text> Sankey flui da direita para esquerda (componente →
          produtos)
        </li>
      </ul>

      <Title level={4}>Controles e Funcionalidades</Title>
      <Paragraph>O Onde Usado compartilha todos os controles da Estrutura:</Paragraph>
      <ul>
        <li>Data de referência para consulta temporal</li>
        <li>Mostrar/ocultar componentes fora de validade</li>
        <li>Tipo de estrutura: Engenharia ou Consumo</li>
        <li>Modo de apresentação: Estrutura ou Lista</li>
        <li>Ajustes de cores, zoom e espaçamento por visualização</li>
        <li>Navegação drill-down com breadcrumb</li>
        <li>Exportação em múltiplos formatos (CSV, Excel, PDF, Impressão)</li>
      </ul>

      <Title level={4}>Dicas Importantes</Title>
      <ul>
        <li>
          Use a visualização <Text strong>Tabela</Text> para análise detalhada e exportação completa
        </li>
        <li>
          Use <Text strong>Sankey</Text> para entender rapidamente o fluxo ascendente e impacto nas
          quantidades
        </li>
        <li>
          Use <Text strong>Árvore Radial</Text> quando há muitos produtos pais (estruturas
          complexas)
        </li>
        <li>
          O <Text strong>Grafo</Text> é ideal para identificar múltiplos caminhos de onde-usado
        </li>
        <li>
          Componentes muito básicos (como parafusos) podem ter centenas de onde-usado - use filtros
          de profundidade
        </li>
        <li>
          Combine Onde Usado com Estrutura para análise completa: navegue "para cima" e "para baixo"
          na hierarquia
        </li>
        <li>Exportações incluem timestamp e código do item para rastreabilidade</li>
      </ul>

      <Title level={4}>Integração com Outros Módulos</Title>
      <Paragraph>O Onde Usado se integra perfeitamente com:</Paragraph>
      <ul>
        <li>
          <Text strong>Dados Mestres:</Text> Acesse informações cadastrais do componente enquanto
          analisa onde é usado
        </li>
        <li>
          <Text strong>Estrutura:</Text> Alterne entre as abas para visão completa (descendente e
          ascendente)
        </li>
        <li>
          <Text strong>Drill-Down:</Text> Navegue de um componente para seus produtos pais e depois
          para a estrutura desses produtos
        </li>
      </ul>
    </div>
  ),
  keywords: [
    'onde usado',
    'where used',
    'consulta inversa',
    'produtos pais',
    'rastreabilidade',
    'impacto',
    'análise de mudanças',
    'obsolescência',
    'padronização',
    'ascendente',
  ],
};
