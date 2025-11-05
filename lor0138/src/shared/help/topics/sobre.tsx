/**
 * Tópico: Sobre a Aplicação
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const sobre: HelpTopicContent = {
  key: 'sobre',
  title: 'Sobre a Aplicação LOR0138',
  content: (
    <div>
      <Paragraph>
        <Text strong>LOR0138</Text> é um sistema de consulta e gerenciamento de dados mestres de
        itens, desenvolvido para proporcionar acesso rápido e eficiente às informações cadastrais
        dos produtos.
      </Paragraph>
      <Title level={4}>Principais Funcionalidades</Title>
      <ul>
        <li>
          <Text strong>Pesquisa Avançada:</Text> Filtros por código, descrição, GTIN, família,
          família comercial e grupo de estoque
        </li>
        <li>
          <Text strong>Visualização por Abas:</Text> Dados organizados em categorias (Base,
          Dimensões, Planejamento, Manufatura, Fiscal)
        </li>
        <li>
          <Text strong>Exportação Múltipla:</Text> Exporte dados em CSV, Excel, PDF ou imprima
          diretamente
        </li>
        <li>
          <Text strong>Atalhos de Teclado:</Text> Navegação rápida através de combinações de teclas
        </li>
        <li>
          <Text strong>Tema Claro/Escuro:</Text> Interface personalizável para sua preferência
          visual
        </li>
      </ul>
      <Title level={4}>Versão</Title>
      <Paragraph>Versão 1.0.0 - Sistema em desenvolvimento contínuo</Paragraph>
    </div>
  ),
  keywords: ['sobre', 'aplicação', 'versão', 'funcionalidades'],
};
