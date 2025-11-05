/**
 * Tópico: Controles das Visualizações de Onde Usado
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const controlesOndeUsado: HelpTopicContent = {
  key: 'onde-usado-controles',
  title: 'Controles das Visualizações de Onde Usado',
  content: (
    <div>
      <Paragraph>
        As visualizações de Onde Usado compartilham os mesmos controles da Estrutura, mas aplicados
        ao contexto ascendente (componente → produtos pais). Os controles permitem personalizar a
        exibição para análise de impacto e rastreabilidade.
      </Paragraph>

      <Title level={4}>Controles Comuns (Todas as Visualizações)</Title>

      <Title level={5}>Mostrar Quantidade</Title>
      <Paragraph>
        <Text strong>Switch on/off</Text> que controla a exibição de quantidades nos produtos pais.
      </Paragraph>
      <ul>
        <li>Quando ligado: Mostra em qual quantidade o componente é usado em cada produto pai</li>
        <li>Quando desligado: Oculta quantidades para foco na hierarquia de onde-usado</li>
        <li>Essencial para análise de impacto de custo (quantidade × variação de preço)</li>
        <li>Útil desligar em apresentações executivas focadas em rastreabilidade</li>
      </ul>

      <Title level={5}>Cor Base</Title>
      <Paragraph>
        <Text strong>Seletor de cor</Text> que define a cor inicial do degradê de níveis
        ascendentes.
      </Paragraph>
      <ul>
        <li>Clique no quadrado colorido para abrir o seletor</li>
        <li>Níveis ascendentes (0→N) recebem cores do degradê</li>
        <li>Nível 0 (componente consultado) recebe a cor base mais intensa</li>
        <li>Produtos finais (níveis superiores) recebem cores mais claras</li>
        <li>Ajuste para destacar diferentes níveis de hierarquia ascendente</li>
      </ul>

      <Title level={5}>Cor de Fundo</Title>
      <Paragraph>
        <Text strong>Seletor de cor</Text> que define a cor de fundo da visualização.
      </Paragraph>
      <ul>
        <li>Independente do tema claro/escuro do sistema</li>
        <li>Use fundo branco para documentação e impressão</li>
        <li>Use fundo escuro para apresentações em projetores</li>
        <li>Ajuste para melhor contraste com as cores do degradê</li>
      </ul>

      <Title level={5}>Zoom</Title>
      <Paragraph>
        <Text strong>Slider + campo numérico</Text> (50% - 200%) para ajustar o tamanho da
        visualização.
      </Paragraph>
      <ul>
        <li>
          <Text strong>50-80%:</Text> Para componentes com muitos usos (ex: parafusos, arruelas)
        </li>
        <li>
          <Text strong>100%:</Text> Tamanho padrão, adequado para maioria dos casos
        </li>
        <li>
          <Text strong>120-200%:</Text> Para componentes com poucos usos, melhor legibilidade
        </li>
        <li>Scroll automático quando visualização excede área disponível</li>
        <li>Zoom se aplica antes da exportação (PDF captura o zoom atual)</li>
      </ul>

      <Title level={5}>Espaçamento</Title>
      <Paragraph>
        <Text strong>Slider + campo numérico</Text> para ajustar o espaço entre elementos.
      </Paragraph>
      <ul>
        <li>Valores menores: Compacta visualização (útil para muitos produtos pais)</li>
        <li>Valores maiores: Aumenta legibilidade (útil para poucos produtos pais)</li>
        <li>
          Range por visualização:
          <ul>
            <li>Sankey: 5-60px (espaçamento vertical entre nós de produtos pais)</li>
            <li>Árvore: 5-60px (distância entre ramos ascendentes)</li>
            <li>Treemap: 0-10px (gap entre blocos de produtos)</li>
          </ul>
        </li>
      </ul>

      <Title level={4}>Controles Específicos por Visualização</Title>

      <Title level={5}>Tabela: Expandir até Nível Ascendente</Title>
      <Paragraph>
        <Text strong>Slider com marcas</Text> que expande/colapsa a hierarquia ascendente até o
        nível selecionado.
      </Paragraph>
      <ul>
        <li>Nível 0: Mostra apenas o componente consultado</li>
        <li>Nível 1: Adiciona produtos que usam diretamente o componente</li>
        <li>Níveis maiores: Mostra a cadeia completa até produtos finais</li>
        <li>Útil para explorar impacto progressivamente (nível por nível)</li>
        <li>Marcas no slider indicam quantos níveis existem na hierarquia de onde-usado</li>
      </ul>

      <Title level={5}>Árvore: Orientação Ascendente</Title>
      <Paragraph>
        <Text strong>Segmented control</Text> com 3 opções de orientação da árvore ascendente.
      </Paragraph>
      <ul>
        <li>
          <Text strong>Vertical:</Text> Componente embaixo, produtos pais crescendo para cima
          (invertido)
        </li>
        <li>
          <Text strong>Horizontal:</Text> Componente à direita, produtos pais à esquerda (invertido)
        </li>
        <li>
          <Text strong>Radial:</Text> Componente no centro, produtos pais em círculo
          <ul>
            <li>Ideal para componentes com muitos usos diferentes</li>
            <li>Não permite colapso de ramos (sempre totalmente expandida)</li>
            <li>Melhor para visualização geral de impacto</li>
          </ul>
        </li>
      </ul>

      <Title level={5}>Grafo: Layout e Profundidade</Title>
      <Paragraph>
        <Text strong>Múltiplos controles</Text> para visualização de rede de onde-usado.
      </Paragraph>
      <ul>
        <li>
          <Text strong>Layout:</Text>
          <ul>
            <li>Força: Simulação física (componente tende ao centro, produtos pais ao redor)</li>
            <li>Circular: Componente no centro, produtos pais em círculo organizado</li>
          </ul>
        </li>
        <li>
          <Text strong>Profundidade:</Text> Filtra quantos níveis ascendentes mostrar
          <ul>
            <li>Útil para componentes com cadeias longas de onde-usado</li>
            <li>Profundidade 2-3: Foco em usos diretos e próximos</li>
            <li>Profundidade máxima: Mostra até produtos finais</li>
          </ul>
        </li>
        <li>
          <Text strong>Busca:</Text> Encontra produto específico e destaca no grafo
        </li>
        <li>
          <Text strong>Controles Avançados:</Text> Ajuste de física da simulação (força, repulsão,
          etc.)
        </li>
      </ul>

      <Title level={4}>Controles de Contexto (Cabeçalho)</Title>
      <Paragraph>
        Localizados no cabeçalho entre as abas e a visualização, estes controles afetam os dados
        carregados:
      </Paragraph>

      <Title level={5}>Data de Referência</Title>
      <Paragraph>
        <Text strong>Seletor de data</Text> que define qual estrutura de onde-usado consultar.
      </Paragraph>
      <ul>
        <li>Consulta produtos que usavam/usam o componente na data especificada</li>
        <li>Útil para análise temporal: "Quais produtos usavam este componente no passado?"</li>
        <li>Considera validade (dataInicio/dataFim) dos componentes na estrutura</li>
        <li>Padrão: Data atual</li>
      </ul>

      <Title level={5}>Mostrar Histórico</Title>
      <Paragraph>
        <Text strong>Switch</Text> que controla exibição de usos fora de validade.
      </Paragraph>
      <ul>
        <li>
          Quando desligado: Mostra apenas produtos que usam o componente na data de referência
        </li>
        <li>Quando ligado: Mostra também usos fora de validade (cinza/semitransparente)</li>
        <li>Útil para rastrear histórico: "Este produto já usou este componente no passado?"</li>
        <li>Essencial para análise de obsolescência e planejamento de substituição</li>
      </ul>

      <Title level={5}>Tipo de Estrutura</Title>
      <Paragraph>
        <Text strong>Seletor</Text> entre Engenharia e Consumo.
      </Paragraph>
      <ul>
        <li>
          <Text strong>Engenharia:</Text> Quantidades conforme cadastrado na estrutura
        </li>
        <li>
          <Text strong>Consumo:</Text> Quantidades multiplicadas por fator (simula produção)
          <ul>
            <li>Digite quantidade do produto final no campo "Multiplicador"</li>
            <li>Sistema calcula consumo total do componente em cascata</li>
            <li>Útil para planejamento: "Preciso de quanto deste componente para produzir X?"</li>
          </ul>
        </li>
      </ul>

      <Title level={5}>Modo de Apresentação</Title>
      <Paragraph>
        <Text strong>Seletor</Text> entre Estrutura e Lista.
      </Paragraph>
      <ul>
        <li>
          <Text strong>Estrutura:</Text> Visualizações hierárquicas (Tabela, Sankey, Árvore, etc.)
        </li>
        <li>
          <Text strong>Lista:</Text> Lista sumarizada (apenas em modo Consumo)
          <ul>
            <li>Agrupa produtos por código</li>
            <li>Soma quantidades de usos múltiplos</li>
            <li>Mostra quantidade total necessária por produto</li>
            <li>Ideal para geração de ordens de produção</li>
          </ul>
        </li>
      </ul>

      <Title level={4}>Persistência de Preferências</Title>
      <Paragraph>
        <Text strong>Importante:</Text> Todas as preferências são salvas automaticamente:
      </Paragraph>
      <ul>
        <li>Zoom, espaçamento e cores são salvos por tipo de visualização</li>
        <li>Orientação da árvore é salva separadamente</li>
        <li>Layout do grafo é salvo independentemente</li>
        <li>Configurações são mantidas entre sessões (localStorage)</li>
        <li>Cada usuário tem suas próprias preferências</li>
      </ul>

      <Title level={4}>Dicas de Uso</Title>
      <ul>
        <li>
          <Text strong>Componentes com muitos usos:</Text> Reduza zoom (70-80%) e espaçamento
        </li>
        <li>
          <Text strong>Componentes com poucos usos:</Text> Aumente zoom (120-150%) para legibilidade
        </li>
        <li>
          <Text strong>Apresentações:</Text> Use fundo branco, cores fortes e zoom 120%
        </li>
        <li>
          <Text strong>Impressão:</Text> Use fundo branco, cores escuras e ajuste zoom para caber em
          uma página
        </li>
        <li>
          <Text strong>Análise temporal:</Text> Compare com "Mostrar Histórico" ligado vs. desligado
        </li>
        <li>
          <Text strong>Planejamento:</Text> Use modo Consumo com multiplicador e exporte Lista
          Sumarizada
        </li>
      </ul>

      <Title level={4}>Atalhos de Teclado</Title>
      <ul>
        <li>
          <Text keyboard>Duplo clique</Text> em produto: Drill-down (navegar para onde-usado desse
          produto)
        </li>
        <li>
          <Text keyboard>Clique simples</Text> em produto: Selecionar e destacar
        </li>
        <li>
          <Text keyboard>Mouse wheel</Text> sobre gráficos: Zoom (quando aplicável)
        </li>
        <li>
          <Text keyboard>Drag</Text> em nós do grafo: Reposicionar manualmente
        </li>
      </ul>
    </div>
  ),
  keywords: [
    'controles',
    'onde usado',
    'zoom',
    'cores',
    'espaçamento',
    'configuração',
    'personalização',
    'filtros',
    'orientação',
    'layout',
  ],
};
