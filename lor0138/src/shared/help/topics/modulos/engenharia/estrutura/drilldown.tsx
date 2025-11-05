/**
 * Tópico: Navegação por Drill-Down em Estruturas
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const drilldown: HelpTopicContent = {
  key: 'estrutura-drilldown',
  title: 'Navegação por Drill-Down em Estruturas',
  content: (
    <div>
      <Paragraph>
        O recurso de drill-down permite explorar componentes da estrutura de forma progressiva,
        navegando de um item pai para seus componentes e sub-componentes de forma interativa.
      </Paragraph>

      <Title level={4}>O que é Drill-Down?</Title>
      <Paragraph>
        Drill-down é uma técnica de navegação que permite "perfurar" (drill) para níveis mais
        profundos de detalhe. Na estrutura de produtos, isso significa:
      </Paragraph>
      <ul>
        <li>Visualizar inicialmente a estrutura completa de um produto acabado</li>
        <li>Selecionar um componente específico dessa estrutura</li>
        <li>Explorar a estrutura deste componente como se fosse o item principal</li>
        <li>Continuar navegando por sub-componentes recursivamente</li>
      </ul>

      <Title level={4}>Como Fazer Drill-Down</Title>

      <Title level={5}>Método Universal (Todas as Visualizações)</Title>
      <Paragraph>
        <Text strong>Duplo clique</Text> em qualquer componente da estrutura:
      </Paragraph>
      <ol>
        <li>Visualize a estrutura de um item</li>
        <li>Localize o componente que deseja explorar</li>
        <li>
          Dê <Text strong>duplo clique</Text> no componente
        </li>
        <li>O sistema carrega automaticamente a estrutura deste componente</li>
        <li>A visualização é atualizada mostrando o novo item como raiz</li>
      </ol>
      <Paragraph>
        <Text type="secondary">
          Nota: O duplo clique funciona em todas as visualizações (Tabela, Sankey, Árvore, Treemap e
          Grafo).
        </Text>
      </Paragraph>

      <Title level={5}>Método Alternativo (Visualizações Gráficas)</Title>
      <Paragraph>
        Nas visualizações gráficas (Sankey, Árvore, Treemap, Grafo), o duplo clique tem prioridade
        sobre ações de clique simples:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Clique simples:</Text> Seleciona o componente (destaca visualmente)
        </li>
        <li>
          <Text strong>Duplo clique:</Text> Executa drill-down no componente
        </li>
      </ul>

      <Title level={4}>Interação com Processos de Fabricação</Title>
      <Paragraph>
        Componentes que possuem processo de fabricação exibem um indicador visual (badge "Processo"
        ou ícone de engrenagem). A interação com estes itens funciona assim:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Clique simples:</Text> Aguarda 300ms
          <ul>
            <li>Se não houver segundo clique: Abre painel lateral com detalhes do processo</li>
            <li>
              Se houver segundo clique (duplo): Cancela abertura do painel e executa drill-down
            </li>
          </ul>
        </li>
        <li>
          <Text strong>Duplo clique:</Text> Sempre executa drill-down, ignorando o processo
        </li>
      </ul>
      <Paragraph>
        <Text type="secondary">
          Esta lógica garante que você possa tanto visualizar o processo quanto navegar para o
          componente, sem conflitos.
        </Text>
      </Paragraph>

      <Title level={4}>Feedback Visual Durante Drill-Down</Title>
      <Paragraph>Quando você executa um drill-down, o sistema fornece feedback visual:</Paragraph>
      <ul>
        <li>Loading spinner enquanto carrega a nova estrutura</li>
        <li>Breadcrumb na aba Resultado é atualizado com o caminho de navegação</li>
        <li>Título da aba Estrutura mostra o novo item sendo visualizado</li>
        <li>Todas as visualizações são atualizadas automaticamente</li>
      </ul>

      <Title level={4}>Navegação de Retorno</Title>
      <Paragraph>Para retornar ao item anterior após um drill-down:</Paragraph>
      <ul>
        <li>
          Use o <Text strong>breadcrumb</Text> na aba Resultado para voltar a itens anteriores
        </li>
        <li>
          Ou volte à aba <Text strong>Pesquisar</Text> e selecione outro item
        </li>
        <li>Ou use o histórico de navegação do navegador (botão Voltar)</li>
      </ul>

      <Title level={4}>Casos de Uso</Title>

      <Title level={5}>Análise de Composição de Sub-Montagens</Title>
      <Paragraph>
        Ao explorar uma estrutura complexa, você pode fazer drill-down em sub-montagens para
        entender sua composição específica sem se perder no contexto geral.
      </Paragraph>

      <Title level={5}>Rastreamento de Componentes Comuns</Title>
      <Paragraph>
        Se um componente aparece em várias posições da estrutura, você pode fazer drill-down nele
        para verificar se ele próprio possui uma estrutura complexa.
      </Paragraph>

      <Title level={5}>Validação de Níveis Profundos</Title>
      <Paragraph>
        Para estruturas muito profundas (muitos níveis), pode ser mais fácil fazer drill-downs
        sucessivos do que tentar visualizar toda a hierarquia de uma vez.
      </Paragraph>

      <Title level={5}>Documentação Progressiva</Title>
      <Paragraph>
        Você pode documentar estruturas complexas fazendo drill-down em cada sub-montagem importante
        e exportando PDFs individuais de cada uma.
      </Paragraph>

      <Title level={4}>Dicas e Melhores Práticas</Title>

      <ul>
        <li>
          <Text strong>Mantenha o contexto:</Text> Antes de fazer drill-down, note o código do
          componente no breadcrumb para facilitar retorno
        </li>
        <li>
          <Text strong>Use visualizações complementares:</Text> Faça drill-down na visualização
          Tabela para análise detalhada, depois veja o mesmo componente em Sankey para entender
          fluxos
        </li>
        <li>
          <Text strong>Combine com filtros:</Text> No Grafo, ajuste a profundidade antes do
          drill-down para controlar quantos níveis serão exibidos
        </li>
        <li>
          <Text strong>Documentação sistemática:</Text> Para documentar uma estrutura complexa:
          <ol>
            <li>Visualize a estrutura completa e exporte como PDF</li>
            <li>Faça drill-down em cada sub-montagem principal</li>
            <li>Exporte cada sub-montagem como PDF separado</li>
            <li>Organize os PDFs em uma estrutura de pastas espelhando a hierarquia</li>
          </ol>
        </li>
        <li>
          <Text strong>Evite drill-down em folhas:</Text> Componentes que não têm estrutura (itens
          comprados, matérias-primas) não terão estrutura para exibir após drill-down
        </li>
        <li>
          <Text strong>Verifique indicadores:</Text> Antes de fazer drill-down, verifique se o
          componente tem filhos (ícone de expansão na Tabela, ramificações nas visualizações
          gráficas)
        </li>
      </ul>

      <Title level={4}>Comportamento por Visualização</Title>

      <Title level={5}>Tabela</Title>
      <ul>
        <li>Duplo clique em qualquer linha executa drill-down</li>
        <li>Clique simples apenas seleciona a linha</li>
        <li>Linhas de processo expandidas não interferem</li>
      </ul>

      <Title level={5}>Sankey</Title>
      <ul>
        <li>Duplo clique em qualquer nó (retângulo) executa drill-down</li>
        <li>Clique simples seleciona e pode abrir processo se disponível</li>
        <li>Clique em links (fluxos) não executa drill-down</li>
      </ul>

      <Title level={5}>Árvore</Title>
      <ul>
        <li>Duplo clique em qualquer nó executa drill-down</li>
        <li>Clique simples seleciona e pode abrir processo</li>
        <li>Clique no ícone de expansão (▾/▸) apenas expande/colapsa, não faz drill-down</li>
      </ul>

      <Title level={5}>Treemap</Title>
      <ul>
        <li>Duplo clique em qualquer bloco executa drill-down</li>
        <li>Clique simples seleciona e pode abrir processo</li>
        <li>Funciona em blocos de qualquer tamanho</li>
      </ul>

      <Title level={5}>Grafo</Title>
      <ul>
        <li>Duplo clique em qualquer nó (círculo) executa drill-down</li>
        <li>Clique simples seleciona e pode abrir processo</li>
        <li>Arrastar nós não interfere no drill-down</li>
        <li>Clique em links (arestas) não executa drill-down</li>
      </ul>

      <Title level={4}>Limitações e Considerações</Title>
      <ul>
        <li>Drill-down requer que o componente tenha uma estrutura cadastrada no sistema</li>
        <li>Componentes comprados ou matérias-primas geralmente não têm estrutura</li>
        <li>Cada drill-down gera uma nova requisição ao servidor</li>
        <li>Histórico de drill-downs não é persistido ao recarregar a página</li>
        <li>Use o breadcrumb para rastrear o caminho de navegação</li>
      </ul>
    </div>
  ),
  keywords: [
    'drilldown',
    'drill-down',
    'drill down',
    'navegação',
    'explorar',
    'duplo clique',
    'sub-montagem',
    'componente',
    'hierarquia',
  ],
};
