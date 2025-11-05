/**
 * Estrutura do Índice da Ajuda
 * Define a hierarquia de navegação no menu lateral
 */

import React from 'react';
import {
  BookOutlined,
  SearchOutlined,
  TableOutlined,
  DashboardOutlined,
  FileTextOutlined,
  KeyOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { HelpIndexItem } from '../types/help.types';

/**
 * Índice hierárquico da ajuda
 * Estrutura de navegação no menu lateral
 */
export const helpIndex: HelpIndexItem[] = [
  {
    key: 'sobre',
    title: 'Sobre a Aplicação',
    icon: React.createElement(InfoCircleOutlined),
  },
  {
    key: 'como-usar',
    title: 'Como Usar',
    icon: React.createElement(BookOutlined),
    children: [
      {
        key: 'pesquisa',
        title: 'Pesquisa de Itens',
        icon: React.createElement(SearchOutlined),
        children: [
          {
            key: 'caracteres-curinga',
            title: 'Caracteres Curinga (Wildcards)',
          },
          {
            key: 'busca-por-gtin',
            title: 'Busca por GTIN (Código de Barras)',
          },
        ],
      },
      {
        key: 'navegacao-tabs',
        title: 'Navegação por Abas',
        icon: React.createElement(TableOutlined),
      },
      {
        key: 'controles-interface',
        title: 'Controles de Visibilidade',
        icon: React.createElement(EyeOutlined),
      },
      {
        key: 'exportacao',
        title: 'Exportação de Dados',
        icon: React.createElement(ExportOutlined),
      },
      {
        key: 'exportacaoCatalogo',
        title: 'Exportação em Catálogo',
        icon: React.createElement(ExportOutlined),
      },
      {
        key: 'exportacaoAvancada',
        title: 'Exportação Avançada',
        icon: React.createElement(ExportOutlined),
      },
      {
        key: 'atalhos',
        title: 'Atalhos de Teclado',
        icon: React.createElement(KeyOutlined),
      },
    ],
  },
  {
    key: 'modulos',
    title: 'Módulos',
    icon: React.createElement(AppstoreOutlined),
    children: [
      {
        key: 'dados-mestres',
        title: 'Dados Mestres',
        icon: React.createElement(DashboardOutlined),
        children: [
          {
            key: 'tab-resultado',
            title: 'Aba: Resultado',
          },
          {
            key: 'tab-base',
            title: 'Aba: Base (Informações Gerais)',
          },
          {
            key: 'tab-dimensoes',
            title: 'Aba: Dimensões',
          },
          {
            key: 'tab-suprimentos',
            title: 'Aba: Suprimentos',
          },
        ],
      },
      {
        key: 'pcp',
        title: 'PCP',
        icon: React.createElement(DashboardOutlined),
        children: [
          {
            key: 'tab-resultado-pcp',
            title: 'Aba: Resultado',
          },
          {
            key: 'tab-base-pcp',
            title: 'Aba: Base (Planejamento)',
          },
        ],
      },
      {
        key: 'manufatura',
        title: 'Manufatura',
        icon: React.createElement(DashboardOutlined),
        children: [
          {
            key: 'tab-resultado-manufatura',
            title: 'Aba: Resultado',
          },
          {
            key: 'tab-base-manufatura',
            title: 'Aba: Base',
          },
        ],
      },
      {
        key: 'fiscal',
        title: 'Fiscal',
        icon: React.createElement(DashboardOutlined),
        children: [
          {
            key: 'tab-resultado-fiscal',
            title: 'Aba: Resultado',
          },
          {
            key: 'tab-base-fiscal',
            title: 'Aba: Base',
          },
        ],
      },
      {
        key: 'engenharia',
        title: 'Engenharia',
        icon: React.createElement(ApartmentOutlined),
        children: [
          {
            key: 'tab-resultado-engenharia',
            title: 'Aba: Resultado',
          },
          {
            key: 'tab-estrutura',
            title: 'Aba: Estrutura de Produtos',
          },
          {
            key: 'tab-onde-usado',
            title: 'Aba: Onde Usado (Where Used)',
          },
          {
            key: 'estrutura',
            title: 'Estrutura de Produtos (BOM)',
            children: [
              {
                key: 'estrutura-visualizacoes',
                title: 'Tipos de Visualização',
              },
              {
                key: 'estrutura-controles',
                title: 'Controles das Visualizações',
              },
              {
                key: 'estrutura-drilldown',
                title: 'Navegação Drill-Down',
              },
              {
                key: 'estrutura-exportacao',
                title: 'Exportação de Estruturas e Onde Usado',
              },
            ],
          },
          {
            key: 'onde-usado',
            title: 'Onde Usado (Where Used)',
            children: [
              {
                key: 'onde-usado-visualizacoes',
                title: 'Tipos de Visualização',
              },
              {
                key: 'onde-usado-controles',
                title: 'Controles das Visualizações',
              },
              {
                key: 'onde-usado-drilldown',
                title: 'Navegação Drill-Down Ascendente',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'capitulos',
    title: 'Tópicos Especiais',
    icon: React.createElement(FileTextOutlined),
    children: [
      {
        key: 'capitulo-1',
        title: 'Capítulo 1 - Exemplo',
      },
      {
        key: 'capitulo-2',
        title: 'Capítulo 2 - Exemplo',
      },
    ],
  },
];
