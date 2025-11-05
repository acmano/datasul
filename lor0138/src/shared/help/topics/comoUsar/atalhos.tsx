/**
 * Tópico: Atalhos de Teclado
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const atalhos: HelpTopicContent = {
  key: 'atalhos',
  title: 'Atalhos de Teclado',
  content: (
    <div>
      <Paragraph>O sistema oferece diversos atalhos para aumentar sua produtividade.</Paragraph>
      <Title level={4}>Menu Principal</Title>
      <ul>
        <li>
          <Text keyboard>Ctrl+1</Text> - Dados Mestres
        </li>
        <li>
          <Text keyboard>Ctrl+2</Text> - Engenharias
        </li>
        <li>
          <Text keyboard>Ctrl+3</Text> - PCP
        </li>
        <li>
          <Text keyboard>Ctrl+4</Text> - Manufatura
        </li>
        <li>
          <Text keyboard>Ctrl+5</Text> - Suprimentos
        </li>
        <li>
          <Text keyboard>Ctrl+6</Text> - Fiscal
        </li>
      </ul>
      <Title level={4}>Navegação por Abas</Title>
      <Paragraph>
        <Text strong>Dados Mestres:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - Aba Resultado
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - Aba Base
        </li>
        <li>
          <Text keyboard>Alt+3</Text> - Aba Dimensões
        </li>
        <li>
          <Text keyboard>Alt+4</Text> - Aba Suprimentos
        </li>
      </ul>
      <Paragraph>
        <Text strong>PCP:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - Aba Resultado
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - Aba Base (Planejamento)
        </li>
      </ul>
      <Paragraph>
        <Text strong>Manufatura:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - Aba Resultado
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - Aba Base
        </li>
      </ul>
      <Paragraph>
        <Text strong>Fiscal:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - Aba Resultado
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - Aba Base
        </li>
      </ul>
      <Paragraph>
        <Text strong>Engenharia:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text keyboard>Alt+1</Text> - Aba Resultado
        </li>
        <li>
          <Text keyboard>Alt+2</Text> - Aba Estrutura
        </li>
        <li>
          <Text keyboard>Alt+3</Text> - Aba Onde Usado
        </li>
      </ul>
      <Title level={4}>Sistema de Ajuda</Title>
      <ul>
        <li>
          <Text keyboard>F1</Text> - Ajuda contextual (abre no tópico da tela atual)
        </li>
        <li>
          Clique em <Text strong>Ajuda</Text> no menu - Ajuda contextual
        </li>
      </ul>
      <Title level={4}>Controles de Visibilidade</Title>
      <ul>
        <li>
          <Text keyboard>Ctrl+0</Text> - Mostrar/Esconder menu principal
        </li>
        <li>
          <Text keyboard>Ctrl+Alt+0</Text> - Mostrar/Esconder menu de visualizações (Engenharia)
        </li>
        <li>
          <Text keyboard>Ctrl+Shift+P</Text> - Mostrar/Esconder formulário de pesquisa
        </li>
        <li>
          <Text keyboard>Ctrl+Shift+H</Text> - Mostrar/Esconder header do item (Engenharia)
        </li>
      </ul>
      <Title level={4}>Pesquisa e Navegação</Title>
      <ul>
        <li>
          <Text keyboard>Enter</Text> - Executar pesquisa (quando em campo de filtro)
        </li>
        <li>
          <Text keyboard>↑/↓</Text> - Navegar pela tabela de resultados
        </li>
        <li>
          <Text keyboard>Home/End</Text> - Primeira/Última linha da tabela
        </li>
        <li>
          <Text keyboard>PgUp/PgDn</Text> - Página anterior/próxima
        </li>
      </ul>
    </div>
  ),
  keywords: [
    'atalhos',
    'teclado',
    'keyboard',
    'shortcuts',
    'ctrl',
    'alt',
    'toggle',
    'esconder',
    'mostrar',
    'visibilidade',
  ],
};
