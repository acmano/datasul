/**
 * Tópico: Controles de Interface
 */

import React from 'react';
import { Typography, Alert } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const controlesInterface: HelpTopicContent = {
  key: 'controles-interface',
  title: 'Controles de Visibilidade da Interface',
  content: (
    <div>
      <Paragraph>
        A aplicação oferece diversos controles para personalizar a visualização da interface,
        permitindo que você maximize a área de dados ocultando elementos conforme necessário.
      </Paragraph>

      <Alert
        message="Dica de Produtividade"
        description="Use os atalhos de teclado para alternar rapidamente a visibilidade dos elementos durante o trabalho."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>Controles Disponíveis</Title>

      <Title level={5}>1. Menu Principal (Ctrl+0)</Title>
      <Paragraph>
        Localizado no canto superior esquerdo do cabeçalho, este botão permite mostrar ou esconder o
        menu lateral principal com as opções de módulos (Dados Mestres, Engenharias, etc.).
      </Paragraph>
      <ul>
        <li>
          <Text strong>Ícone visível:</Text> <Text code>☰</Text> (três linhas)
        </li>
        <li>
          <Text strong>Atalho:</Text> <Text keyboard>Ctrl+0</Text>
        </li>
        <li>
          <Text strong>Função:</Text> Libera espaço horizontal ocultando o menu lateral
        </li>
      </ul>

      <Title level={5}>2. Formulário de Pesquisa (Ctrl+Shift+P)</Title>
      <Paragraph>
        Este controle permite mostrar ou esconder o formulário de pesquisa com todos os filtros
        disponíveis (código do item, descrição, família, GTIN, etc.).
      </Paragraph>
      <ul>
        <li>
          <Text strong>Ícone visível:</Text> <Text code>🔍</Text> (lupa)
        </li>
        <li>
          <Text strong>Ícone oculto:</Text> <Text code>👁️‍🗨️</Text> (olho com barra)
        </li>
        <li>
          <Text strong>Atalho:</Text> <Text keyboard>Ctrl+Shift+P</Text>
        </li>
        <li>
          <Text strong>Função:</Text> Libera espaço vertical ocultando o formulário de pesquisa
        </li>
      </ul>

      <Title level={5}>3. Header do Item (Ctrl+Shift+H)</Title>
      <Paragraph>
        Disponível apenas no módulo de <Text strong>Engenharia</Text>, este controle permite mostrar
        ou esconder o cabeçalho do item que contém informações e controles específicos (tipo de
        estrutura, data de referência, quantidade, modo de apresentação, etc.).
      </Paragraph>
      <ul>
        <li>
          <Text strong>Ícone visível:</Text> <Text code>📄</Text> (documento)
        </li>
        <li>
          <Text strong>Ícone oculto:</Text> <Text code>👁️‍🗨️</Text> (olho com barra)
        </li>
        <li>
          <Text strong>Atalho:</Text> <Text keyboard>Ctrl+Shift+H</Text>
        </li>
        <li>
          <Text strong>Função:</Text> Libera espaço vertical ocultando o header do item
        </li>
        <li>
          <Text strong>Disponibilidade:</Text> Apenas no módulo Engenharia (abas Estrutura e Onde
          Usado)
        </li>
      </ul>

      <Title level={5}>4. Menu de Visualizações (Ctrl+Alt+0)</Title>
      <Paragraph>
        Também disponível apenas no módulo de <Text strong>Engenharia</Text>, este controle permite
        mostrar ou esconder o menu lateral de seleção de visualizações (Tabela, Sankey, Árvore,
        Treemap, Grafo).
      </Paragraph>
      <ul>
        <li>
          <Text strong>Atalho:</Text> <Text keyboard>Ctrl+Alt+0</Text>
        </li>
        <li>
          <Text strong>Função:</Text> Libera espaço horizontal ocultando o menu de visualizações
        </li>
        <li>
          <Text strong>Disponibilidade:</Text> Apenas no módulo Engenharia (abas Estrutura e Onde
          Usado)
        </li>
      </ul>

      <Title level={4}>Casos de Uso</Title>

      <Title level={5}>Maximizar Área de Dados</Title>
      <Paragraph>
        Para trabalhar focado apenas nos dados, você pode ocultar todos os elementos da interface:
      </Paragraph>
      <ol>
        <li>
          Pressione <Text keyboard>Ctrl+0</Text> para esconder o menu principal
        </li>
        <li>
          Pressione <Text keyboard>Ctrl+Shift+P</Text> para esconder o formulário de pesquisa
        </li>
        <li>
          (Se em Engenharia) Pressione <Text keyboard>Ctrl+Shift+H</Text> para esconder o header do
          item
        </li>
        <li>
          (Se em Engenharia) Pressione <Text keyboard>Ctrl+Alt+0</Text> para esconder o menu de
          visualizações
        </li>
      </ol>

      <Title level={5}>Apresentação/Demonstração</Title>
      <Paragraph>
        Durante apresentações ou demonstrações, oculte elementos desnecessários para focar a atenção
        da audiência nos dados relevantes.
      </Paragraph>

      <Title level={5}>Trabalho em Tela Pequena</Title>
      <Paragraph>
        Em notebooks ou monitores menores, oculte elementos para aproveitar melhor o espaço
        disponível.
      </Paragraph>

      <Alert
        message="Importante"
        description="Os estados de visibilidade são mantidos apenas durante a sessão atual. Ao recarregar a página, todos os elementos voltam a ser visíveis."
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  ),
  keywords: [
    'controles',
    'interface',
    'visibilidade',
    'esconder',
    'mostrar',
    'toggle',
    'menu',
    'pesquisa',
    'header',
    'maximizar',
    'tela',
    'espaço',
  ],
};
