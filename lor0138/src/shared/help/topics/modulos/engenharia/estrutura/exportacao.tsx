/**
 * Tópico: Exportação de Estruturas
 */

import React from 'react';
import { Typography } from 'antd';
import type { HelpTopicContent } from '../../../../../types/help.types';

const { Title, Paragraph, Text } = Typography;

export const exportacao: HelpTopicContent = {
  key: 'estrutura-exportacao',
  title: 'Exportação de Estruturas e Onde Usado',
  content: (
    <div>
      <Paragraph>
        Cada visualização de estrutura e onde usado oferece opções específicas de exportação,
        adequadas ao tipo de dados e formato de apresentação. As funcionalidades de exportação estão
        disponíveis tanto na aba <Text strong>Produtos</Text> (estrutura) quanto na aba{' '}
        <Text strong>Onde Usado</Text>.
      </Paragraph>

      <Title level={4}>Formatos Disponíveis por Visualização</Title>

      <Title level={5}>Tabela Hierárquica</Title>
      <Paragraph>
        Suporta <Text strong>todos os formatos</Text> de exportação:
      </Paragraph>
      <ul>
        <li>
          <Text strong>CSV:</Text> Arquivo texto separado por vírgulas
          <ul>
            <li>Inclui: Nível, Código, Descrição, Quantidade, UN, Processo (Sim/Não)</li>
            <li>Compatível com Excel e outras planilhas</li>
            <li>Ideal para análise de dados e importação em outros sistemas</li>
          </ul>
        </li>
        <li>
          <Text strong>Excel (XLSX):</Text> Planilha Microsoft Excel com formatação
          <ul>
            <li>Mesmas colunas do CSV com formatação preservada</li>
            <li>Cabeçalhos em negrito e células formatadas</li>
            <li>Ideal para relatórios e compartilhamento</li>
          </ul>
        </li>
        <li>
          <Text strong>PDF:</Text> Documento portátil da tabela
          <ul>
            <li>Tabela formatada com todas as colunas</li>
            <li>Cabeçalho com informações do item</li>
            <li>Múltiplas páginas quando necessário</li>
            <li>Ideal para documentação e arquivo</li>
          </ul>
        </li>
        <li>
          <Text strong>Imprimir:</Text> Impressão direta da tabela
          <ul>
            <li>Abre diálogo de impressão do navegador</li>
            <li>Mesma formatação do PDF</li>
            <li>Opções de configuração de página disponíveis</li>
          </ul>
        </li>
      </ul>

      <Title level={5}>Visualizações Gráficas (Sankey, Árvore, Treemap, Grafo)</Title>
      <Paragraph>
        Suportam <Text strong>PDF e Impressão</Text> dos gráficos:
      </Paragraph>
      <ul>
        <li>
          <Text strong>PDF:</Text> Exporta o gráfico como imagem de alta qualidade
          <ul>
            <li>Renderização SVG para qualidade vetorial</li>
            <li>Preserva cores, layout e zoom atual</li>
            <li>Inclui cabeçalho com tipo de visualização e item</li>
            <li>Nome do arquivo inclui tipo, código do item e timestamp</li>
          </ul>
        </li>
        <li>
          <Text strong>Imprimir:</Text> Impressão direta do gráfico
          <ul>
            <li>Abre diálogo de impressão com preview</li>
            <li>Mesma qualidade do PDF</li>
            <li>Ajuste zoom antes de imprimir para controlar tamanho</li>
          </ul>
        </li>
      </ul>

      <Title level={4}>Como Exportar</Title>

      <Title level={5}>Passo a Passo</Title>
      <Paragraph>
        1. Selecione um item e visualize sua estrutura
        <br />
        2. Escolha a visualização desejada (Tabela, Sankey, Árvore, etc.)
        <br />
        3. Ajuste controles de visualização (zoom, cores, layout) conforme necessário
        <br />
        4. Localize a barra de ferramentas de exportação no canto superior direito
        <br />
        5. Clique no botão do formato desejado
        <br />
        6. O arquivo será baixado automaticamente ou o diálogo de impressão será aberto
      </Paragraph>

      <Title level={5}>Barra de Ferramentas de Exportação</Title>
      <Paragraph>
        Os botões de exportação ficam sempre visíveis no canto superior direito de cada
        visualização:
      </Paragraph>
      <ul>
        <li>Ícone CSV: Exportar como CSV (apenas Tabela)</li>
        <li>Ícone Excel: Exportar como XLSX (apenas Tabela)</li>
        <li>Ícone PDF: Exportar como PDF (todas visualizações)</li>
        <li>Ícone Impressora: Imprimir (todas visualizações)</li>
      </ul>
      <Paragraph>
        Botões ficam desabilitados (acinzentados) quando não aplicáveis ou quando não há dados.
      </Paragraph>

      <Title level={4}>Nomenclatura de Arquivos</Title>
      <Paragraph>
        Os arquivos exportados seguem um padrão de nomenclatura automático que identifica o contexto
        (estrutura ou onde usado):
      </Paragraph>
      <Title level={5}>Exportação da Estrutura de Produtos</Title>
      <ul>
        <li>
          Tabela CSV: <Text code>estrutura.csv</Text>
        </li>
        <li>
          Tabela Excel: <Text code>estrutura.xlsx</Text>
        </li>
        <li>
          Tabela PDF: <Text code>estrutura.pdf</Text>
        </li>
        <li>
          Sankey PDF: <Text code>sankey_[codigo-item]_[timestamp].pdf</Text>
        </li>
        <li>
          Árvore PDF: <Text code>arvore_[codigo-item]_[timestamp].pdf</Text>
        </li>
        <li>
          Treemap PDF: <Text code>treemap_[codigo-item]_[timestamp].pdf</Text>
        </li>
        <li>
          Grafo PDF: <Text code>grafo_[codigo-item]_[timestamp].pdf</Text>
        </li>
      </ul>
      <Title level={5}>Exportação de Onde Usado</Title>
      <ul>
        <li>
          Tabela CSV: <Text code>onde_usado_[codigo-item]_[timestamp].csv</Text>
        </li>
        <li>
          Tabela Excel: <Text code>onde_usado_[codigo-item]_[timestamp].xlsx</Text> (formato XLSX)
        </li>
        <li>
          Tabela PDF: <Text code>onde_usado.pdf</Text>
        </li>
        <li>
          Gráficos (Sankey, Árvore, Treemap, Grafo): Seguem o mesmo padrão da estrutura, com o fluxo
          invertido
        </li>
      </ul>
      <Paragraph>
        O timestamp segue o formato ISO (YYYY-MM-DDTHH-MM-SS), permitindo rastreabilidade das
        exportações.
      </Paragraph>

      <Title level={4}>Dicas para Exportação</Title>

      <Title level={5}>Para Análise de Dados</Title>
      <ul>
        <li>
          Use a visualização <Text strong>Tabela</Text>
        </li>
        <li>
          Exporte como <Text strong>CSV</Text> ou <Text strong>Excel</Text>
        </li>
        <li>Habilite "Mostrar Quantidade" antes de exportar</li>
        <li>Expanda todos os níveis desejados antes da exportação</li>
      </ul>

      <Title level={5}>Para Documentação</Title>
      <ul>
        <li>Use qualquer visualização adequada</li>
        <li>
          Exporte como <Text strong>PDF</Text>
        </li>
        <li>Ajuste cores para melhor impressão (cores mais escuras)</li>
        <li>Use fundo branco para economizar tinta</li>
        <li>Ajuste zoom para caber na página</li>
      </ul>

      <Title level={5}>Para Apresentações</Title>
      <ul>
        <li>
          Use <Text strong>Sankey</Text>, <Text strong>Árvore Radial</Text> ou{' '}
          <Text strong>Treemap</Text>
        </li>
        <li>
          Exporte como <Text strong>PDF</Text>
        </li>
        <li>Ajuste cores para alto contraste</li>
        <li>Use zoom maior (120-150%) para legibilidade</li>
        <li>Simplifique exibindo apenas níveis superiores se necessário</li>
      </ul>

      <Title level={5}>Otimização de Qualidade</Title>
      <ul>
        <li>
          Todas as visualizações gráficas usam renderização <Text strong>SVG</Text> para máxima
          qualidade
        </li>
        <li>PDFs mantêm qualidade vetorial, permitindo zoom sem perda</li>
        <li>Ajuste zoom antes da exportação para controlar tamanho final</li>
        <li>
          Estruturas muito grandes podem gerar PDFs grandes - considere filtrar por profundidade no
          Grafo
        </li>
      </ul>

      <Title level={4}>Diferença entre Estrutura e Onde Usado</Title>
      <Paragraph>
        As exportações funcionam de forma idêntica em ambas as abas, mas com direções opostas:
      </Paragraph>
      <ul>
        <li>
          <Text strong>Estrutura (Produtos):</Text> Mostra os componentes que formam um produto
          (hierarquia descendente - do pai para os filhos)
        </li>
        <li>
          <Text strong>Onde Usado:</Text> Mostra em quais produtos um componente é utilizado
          (hierarquia ascendente - do filho para os pais)
        </li>
        <li>
          Os formatos de exportação são os mesmos, apenas o conteúdo reflete a direção da consulta
        </li>
        <li>Visualizações gráficas automaticamente invertem o fluxo em Onde Usado</li>
      </ul>

      <Title level={4}>Observações Importantes</Title>
      <ul>
        <li>Exportações capturam o estado atual da visualização (zoom, cores, layout)</li>
        <li>Dados de processo de fabricação não são incluídos nas exportações CSV/Excel</li>
        <li>
          Para incluir processos, use a visualização Tabela com processos expandidos e exporte como
          PDF
        </li>
        <li>Estruturas muito grandes podem levar alguns segundos para gerar o arquivo</li>
        <li>Uma mensagem de sucesso aparece após conclusão da exportação</li>
        <li>Em caso de erro, uma mensagem de erro é exibida</li>
        <li>
          Arquivos de Onde Usado incluem o código do item e timestamp no nome para fácil
          identificação
        </li>
      </ul>
    </div>
  ),
  keywords: [
    'exportação',
    'exportar',
    'pdf',
    'csv',
    'excel',
    'imprimir',
    'download',
    'salvar',
    'arquivo',
    'onde usado',
    'where used',
  ],
};
