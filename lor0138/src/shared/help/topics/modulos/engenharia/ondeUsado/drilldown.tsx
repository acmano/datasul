/**
 * Tópico: Navegação por Drill-Down em Onde Usado
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const drilldownOndeUsado: HelpTopicContent = {
  key: 'onde-usado-drilldown',
  title: 'Navegação por Drill-Down em Onde Usado',
  content: (
    <div>
      <Paragraph>
        O recurso de drill-down no Onde Usado permite explorar progressivamente a cadeia ascendente
        de produtos, navegando de um componente para os produtos que o usam, e desses produtos para
        seus próprios onde-usado, subindo na hierarquia de forma interativa.
      </Paragraph>

      <Title level={4}>O que é Drill-Down em Onde Usado?</Title>
      <Paragraph>
        No contexto de Onde Usado, drill-down significa "subir na árvore" de produtos, explorando
        sucessivamente em quais produtos cada item é utilizado:
      </Paragraph>
      <ul>
        <li>Visualizar inicialmente onde um componente específico é usado</li>
        <li>Selecionar um dos produtos pais que usa o componente</li>
        <li>
          Explorar onde <Text italic>este produto pai</Text> é usado (o onde-usado do onde-usado)
        </li>
        <li>Continuar navegando ascendente até produtos finais</li>
      </ul>

      <Title level={4}>Exemplo Prático</Title>
      <Paragraph>Considere a hierarquia: Raio → Aro → Roda → Bicicleta</Paragraph>
      <ol>
        <li>
          <Text strong>Passo 1:</Text> Consulte "Onde Usado" do <Text code>Raio</Text>
          <br />
          Resultado: O Raio é usado no Aro
        </li>
        <li>
          <Text strong>Passo 2:</Text> Faça drill-down no <Text code>Aro</Text>
          <br />
          Resultado: O Aro é usado na Roda
        </li>
        <li>
          <Text strong>Passo 3:</Text> Faça drill-down na <Text code>Roda</Text>
          <br />
          Resultado: A Roda é usada na Bicicleta
        </li>
        <li>
          <Text strong>Passo 4:</Text> Faça drill-down na <Text code>Bicicleta</Text>
          <br />
          Resultado: A Bicicleta não é usada em nenhum produto (produto final)
        </li>
      </ol>

      <Title level={4}>Como Fazer Drill-Down</Title>

      <Title level={5}>Método Universal (Todas as Visualizações)</Title>
      <Paragraph>
        <Text strong>Duplo clique</Text> em qualquer produto pai:
      </Paragraph>
      <ol>
        <li>Visualize o onde-usado de um componente</li>
        <li>Localize um produto pai na visualização</li>
        <li>
          Dê <Text strong>duplo clique</Text> no produto pai
        </li>
        <li>O sistema carrega automaticamente o onde-usado deste produto</li>
        <li>Você agora vê em quais produtos este produto pai é utilizado</li>
      </ol>
      <Paragraph>
        <Text type="secondary">
          Nota: O duplo clique funciona em todas as visualizações (Tabela, Sankey, Árvore, Treemap e
          Grafo), permitindo navegação ascendente consistente.
        </Text>
      </Paragraph>

      <Title level={5}>Comportamento em Cada Visualização</Title>
      <ul>
        <li>
          <Text strong>Tabela:</Text> Duplo clique em qualquer linha de produto pai
        </li>
        <li>
          <Text strong>Sankey:</Text> Duplo clique em qualquer nó (retângulo) de produto pai
        </li>
        <li>
          <Text strong>Árvore:</Text> Duplo clique em qualquer nó que não seja a raiz
        </li>
        <li>
          <Text strong>Treemap:</Text> Duplo clique em qualquer bloco representa produto pai
        </li>
        <li>
          <Text strong>Grafo:</Text> Duplo clique em qualquer nó conectado ao componente central
        </li>
      </ul>

      <Title level={4}>Breadcrumb de Navegação</Title>
      <Paragraph>
        O sistema mantém um breadcrumb (rastro de navegação) mostrando o caminho percorrido:
      </Paragraph>
      <ul>
        <li>Aparece no topo da visualização, logo abaixo das abas</li>
        <li>Mostra a sequência de itens navegados (da esquerda para direita)</li>
        <li>
          Exemplo: <Text code>Raio &gt; Aro &gt; Roda &gt; Bicicleta</Text>
        </li>
        <li>Clique em qualquer item do breadcrumb para voltar àquele ponto</li>
        <li>
          O breadcrumb é compartilhado entre as abas Estrutura e Onde Usado (permite alternar
          contexto)
        </li>
      </ul>

      <Title level={4}>Feedback Visual Durante Drill-Down</Title>
      <Paragraph>
        Quando você executa um drill-down ascendente, o sistema fornece feedback:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Loading overlay:</Text> Spinner com mensagem "Carregando onde usado..."
        </li>
        <li>
          <Text strong>Breadcrumb atualizado:</Text> Novo item é adicionado ao caminho
        </li>
        <li>
          <Text strong>Título atualizado:</Text> Cabeçalho mostra o item atual sendo consultado
        </li>
        <li>
          <Text strong>Visualização recarregada:</Text> Todos os dados são atualizados para o novo
          contexto
        </li>
        <li>
          <Text strong>Mensagem de sucesso:</Text> "Navegando para item [código]"
        </li>
      </ul>

      <Title level={4}>Identificando Produtos Finais</Title>
      <Paragraph>
        Um <Text strong>produto final</Text> é aquele que não é usado em nenhum outro produto.
        Quando você faz drill-down em um produto final:
      </Paragraph>
      <ul>
        <li>A consulta de onde-usado retorna vazia (sem produtos pais)</li>
        <li>As visualizações mostram apenas o item consultado (nível 0)</li>
        <li>É um indicador de que você chegou ao topo da cadeia de produtos</li>
        <li>Útil para identificar produtos acabados vs. componentes intermediários</li>
      </ul>

      <Title level={4}>Interação com Processos de Fabricação</Title>
      <Paragraph>
        Produtos pais que possuem processo de fabricação exibem indicador visual (badge "Processo"):
      </Paragraph>
      <ul>
        <li>
          <Text strong>Clique simples:</Text> Aguarda 300ms
          <ul>
            <li>
              Se não houver segundo clique: Abre painel lateral com detalhes do processo do produto
              pai
            </li>
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
          Isso permite consultar o processo de fabricação do produto pai sem precisar navegar para
          ele.
        </Text>
      </Paragraph>

      <Title level={4}>Navegação de Retorno</Title>
      <Paragraph>Para retornar a níveis anteriores após drill-down ascendente:</Paragraph>
      <ul>
        <li>
          <Text strong>Breadcrumb:</Text> Clique em qualquer item anterior no caminho de navegação
        </li>
        <li>
          <Text strong>Voltar ao início:</Text> Clique no primeiro item do breadcrumb (componente
          original)
        </li>
        <li>
          <Text strong>Nova pesquisa:</Text> Volte à aba Pesquisar e selecione outro item
        </li>
        <li>
          <Text strong>Histórico do navegador:</Text> Use o botão Voltar do navegador (funciona, mas
          breadcrumb é mais rápido)
        </li>
      </ul>

      <Title level={4}>Casos de Uso</Title>

      <Title level={5}>1. Rastreamento Completo de Impacto</Title>
      <Paragraph>
        Começando de um componente básico, faça drill-downs sucessivos para identificar toda a
        cadeia de produtos até produtos finais. Essencial para análise de impacto completo de
        mudanças.
      </Paragraph>
      <Paragraph>
        <Text strong>Exemplo:</Text> "Se mudar este parafuso, quais produtos finais são afetados?"
      </Paragraph>

      <Title level={5}>2. Identificação de Produtos Finais</Title>
      <Paragraph>
        Navegue ascendentemente até encontrar produtos sem onde-usado (produtos finais). Útil para
        entender quais são os produtos vendáveis que dependem de um componente.
      </Paragraph>

      <Title level={5}>3. Análise de Caminhos Múltiplos</Title>
      <Paragraph>
        Se um componente é usado em múltiplos produtos, você pode fazer drill-down em cada um
        separadamente para explorar diferentes cadeias de impacto.
      </Paragraph>
      <Paragraph>
        <Text strong>Exemplo:</Text> Um parafuso usado em 5 produtos diferentes pode ter caminhos
        diferentes até produtos finais.
      </Paragraph>

      <Title level={5}>4. Validação de Obsolescência</Title>
      <Paragraph>
        Para um item marcado como obsoleto, navegue ascendentemente para validar se todos os
        produtos pais também estão obsoletos ou se há necessidade de substituição.
      </Paragraph>

      <Title level={5}>5. Documentação de Cadeia de Valor</Title>
      <Paragraph>
        Documente progressivamente a cadeia de valor fazendo drill-downs e exportando PDFs em cada
        nível. Útil para documentação de processos e apresentações.
      </Paragraph>

      <Title level={4}>Combinando com Estrutura</Title>
      <Paragraph>
        O drill-down em Onde Usado pode ser combinado com navegação na Estrutura:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Subir e Descer:</Text> Faça drill-down em Onde Usado para subir, depois mude
          para aba Estrutura para descer
        </li>
        <li>
          <Text strong>Validação Cruzada:</Text> Verifique se o caminho ascendente (Onde Usado)
          corresponde ao caminho descendente (Estrutura)
        </li>
        <li>
          <Text strong>Análise Completa:</Text> Entenda tanto "o que compõe" quanto "onde é usado"
          para visão 360°
        </li>
      </ul>

      <Title level={4}>Dicas e Melhores Práticas</Title>

      <ul>
        <li>
          <Text strong>Anote produtos finais:</Text> Ao fazer drill-down sucessivos, anote quando
          encontrar produtos finais (sem onde-usado)
        </li>
        <li>
          <Text strong>Use breadcrumb ativamente:</Text> Não navegue apenas para frente, use o
          breadcrumb para explorar ramificações alternativas
        </li>
        <li>
          <Text strong>Combine visualizações:</Text> Use Tabela para visão geral, depois drill-down
          e mude para Sankey para entender fluxos
        </li>
        <li>
          <Text strong>Exporte em cada nível:</Text> Se está documentando, exporte PDF em cada nível
          significativo antes de fazer drill-down
        </li>
        <li>
          <Text strong>Grafo para múltiplos caminhos:</Text> Se um componente tem muitos usos, use
          Grafo antes de drill-down para escolher qual caminho explorar
        </li>
        <li>
          <Text strong>Profundidade vs. Largura:</Text> Você pode explorar "profundo" (drill-down
          sucessivo) ou "largo" (múltiplos drill-downs paralelos via nova pesquisa)
        </li>
      </ul>

      <Title level={4}>Limitações e Considerações</Title>
      <ul>
        <li>O drill-down carrega dados do servidor - pode haver delay de alguns segundos</li>
        <li>
          O breadcrumb tem limite visual (~5-6 itens) - breadcrumbs muito longos usam scroll
          horizontal
        </li>
        <li>Dados são sempre carregados da data de referência configurada no cabeçalho</li>
        <li>O drill-down respeita as configurações de "Mostrar Histórico" e tipo de estrutura</li>
        <li>Cache é mantido por item - voltar via breadcrumb é instantâneo (usa cache)</li>
      </ul>

      <Title level={4}>Atalhos de Teclado</Title>
      <ul>
        <li>
          <Text keyboard>Duplo clique</Text> em produto: Drill-down ascendente
        </li>
        <li>
          <Text keyboard>Clique</Text> em breadcrumb: Volta para aquele nível
        </li>
        <li>
          <Text keyboard>Alt+3</Text>: Atalho para aba Onde Usado (útil ao alternar com Estrutura)
        </li>
        <li>
          <Text keyboard>Alt+2</Text>: Atalho para aba Estrutura (para navegação descendente)
        </li>
      </ul>

      <Title level={4}>Troubleshooting</Title>
      <Paragraph>
        <Text strong>Drill-down não funciona:</Text>
      </Paragraph>
      <ul>
        <li>Certifique-se de dar duplo clique (não clique simples)</li>
        <li>Aguarde carregamento completo antes de tentar drill-down</li>
        <li>
          Se produto pai não tem onde-usado, a visualização ficará vazia (é comportamento esperado
          para produtos finais)
        </li>
      </ul>

      <Paragraph>
        <Text strong>Breadcrumb não aparece:</Text>
      </Paragraph>
      <ul>
        <li>Breadcrumb só aparece após pelo menos um drill-down</li>
        <li>Se está na primeira consulta (sem navegação), não há breadcrumb</li>
      </ul>

      <Paragraph>
        <Text strong>Performance lenta:</Text>
      </Paragraph>
      <ul>
        <li>Componentes muito utilizados podem ter muitos níveis de onde-usado</li>
        <li>Use filtro de profundidade no Grafo para limitar dados carregados</li>
        <li>Considere usar visualização Tabela para melhor performance</li>
      </ul>
    </div>
  ),
  keywords: [
    'drill-down',
    'navegação',
    'onde usado',
    'breadcrumb',
    'ascendente',
    'produtos pais',
    'rastreamento',
    'produtos finais',
    'caminho',
    'hierarquia',
  ],
};
