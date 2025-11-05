// src/modules/pcp/base/planejamento/utils/export/print.ts

import { ItemPlanejamento, EstabelecimentoPlanejamento } from '../../types';

export const printPlanejamento = (
  planejamento: ItemPlanejamento,
  estabelecimentoCodigo: string
) => {
  if (!planejamento) {
    alert('Não há dados para imprimir');
    return;
  }

  const estab = planejamento.item.estabelecimento.find(
    (e: EstabelecimentoPlanejamento) => e.codigo === estabelecimentoCodigo
  );
  if (!estab) {
    alert('Estabelecimento não encontrado');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    return value.toString();
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Planejamento - ${planejamento.item.codigo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1890ff;
          border-bottom: 2px solid #1890ff;
          padding-bottom: 10px;
        }
        h2 {
          color: #1890ff;
          margin-top: 20px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #1890ff;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .section {
          page-break-inside: avoid;
        }
        @media print {
          body {
            margin: 0;
          }
          h1 {
            page-break-after: avoid;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>Planejamento do Item</h1>
      <p><strong>Item:</strong> ${planejamento.item.codigo} - ${planejamento.item.descricao}</p>
      <p><strong>Estabelecimento:</strong> ${estab.codigo} - ${estab.nome}</p>

      <div class="section">
        <h2>Produção 1</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Depósito Padrão</td>
            <td>${formatValue(estab.producao1.depositoPadrao)}</td>
          </tr>
          <tr>
            <td>Localização</td>
            <td>${formatValue(estab.producao1.localizacao)}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>${formatValue(estab.producao1.status)}</td>
          </tr>
          <tr>
            <td>Planejador</td>
            <td>${estab.producao1.planejador.codigo} - ${estab.producao1.planejador.nome}</td>
          </tr>
          <tr>
            <td>Linha Produção</td>
            <td>${formatValue(estab.producao1.linhaProducao.codigo)} - ${estab.producao1.linhaProducao.nome}</td>
          </tr>
          <tr>
            <td>Capacidade Estoque</td>
            <td>${formatValue(estab.producao1.chaoDeFabrica.capacidadeEstoque)}</td>
          </tr>
          <tr>
            <td>Considera Aloc. Atividades</td>
            <td>${formatValue(estab.producao1.chaoDeFabrica.consideraAlocAtividades)}</td>
          </tr>
          <tr>
            <td>Programa Aloc. Atividades</td>
            <td>${formatValue(estab.producao1.chaoDeFabrica.programaAlocAtividades)}</td>
          </tr>
          <tr>
            <td>Percentual Overlap</td>
            <td>${formatValue(estab.producao1.chaoDeFabrica.percentualOverlap)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Produção 2</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Reporta MOB</td>
            <td>${formatValue(estab.producao2.reportaMOB)}</td>
          </tr>
          <tr>
            <td>Reporta GGF</td>
            <td>${formatValue(estab.producao2.reportaGGF)}</td>
          </tr>
          <tr>
            <td>Tipo Alocação</td>
            <td>${formatValue(estab.producao2.tipoAlocacao)}</td>
          </tr>
          <tr>
            <td>Tipo Requisição</td>
            <td>${formatValue(estab.producao2.tipoRequisicao)}</td>
          </tr>
          <tr>
            <td>Processo Custos</td>
            <td>${formatValue(estab.producao2.processoCustos)}</td>
          </tr>
          <tr>
            <td>Reporte Produção</td>
            <td>${formatValue(estab.producao2.reporteProducao)}</td>
          </tr>
          <tr>
            <td>Tratamento Refugo</td>
            <td>${formatValue(estab.producao2.refugo.tratamentoRefugo)}</td>
          </tr>
          <tr>
            <td>Controla Estoque</td>
            <td>${formatValue(estab.producao2.refugo.controlaEstoque)}</td>
          </tr>
          <tr>
            <td>Preço Fiscal</td>
            <td>${formatValue(estab.producao2.refugo.precoFiscal)}</td>
          </tr>
          <tr>
            <td>Item Refugo</td>
            <td>${estab.producao2.refugo.item.codigo} - ${estab.producao2.refugo.item.descricao}</td>
          </tr>
          <tr>
            <td>Relação Item</td>
            <td>${formatValue(estab.producao2.refugo.relacaoItem)}</td>
          </tr>
          <tr>
            <td>Fator</td>
            <td>${formatValue(estab.producao2.refugo.fator)}</td>
          </tr>
          <tr>
            <td>Perda</td>
            <td>${formatValue(estab.producao2.refugo.perda)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Reposição</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Política</td>
            <td>${formatValue(estab.reposicao.politica)}</td>
          </tr>
          <tr>
            <td>Tipo Demanda</td>
            <td>${formatValue(estab.reposicao.tipoDemanda)}</td>
          </tr>
          <tr>
            <td>Lote Múltiplo</td>
            <td>${formatValue(estab.reposicao.lote.multiplo)}</td>
          </tr>
          <tr>
            <td>Lote Mínimo</td>
            <td>${formatValue(estab.reposicao.lote.minimo)}</td>
          </tr>
          <tr>
            <td>Lote Econômico</td>
            <td>${formatValue(estab.reposicao.lote.economico)}</td>
          </tr>
          <tr>
            <td>Período Fixo</td>
            <td>${formatValue(estab.reposicao.lote.periodoFixo)}</td>
          </tr>
          <tr>
            <td>Ponto Reposição</td>
            <td>${formatValue(estab.reposicao.lote.pontoReposicao)}</td>
          </tr>
          <tr>
            <td>Estoque Segurança - Tipo</td>
            <td>${formatValue(estab.reposicao.estoqueSeguranca.tipo)}</td>
          </tr>
          <tr>
            <td>Estoque Segurança - Valor</td>
            <td>${formatValue(estab.reposicao.estoqueSeguranca.valor)}</td>
          </tr>
          <tr>
            <td>Converte Tempo</td>
            <td>${formatValue(estab.reposicao.estoqueSeguranca.converteTempo)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>MRP</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Classe Reprogramação</td>
            <td>${formatValue(estab.mrp.classeReprogramacao)}</td>
          </tr>
          <tr>
            <td>Emissão Ordens</td>
            <td>${formatValue(estab.mrp.emissaoOrdens)}</td>
          </tr>
          <tr>
            <td>Divisão Ordens</td>
            <td>${formatValue(estab.mrp.divisaoOrdens)}</td>
          </tr>
          <tr>
            <td>Prioridade</td>
            <td>${formatValue(estab.mrp.prioridade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Compras - Quantidade</td>
            <td>${formatValue(estab.mrp.ressuprimento.compras.quantidade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Compras - Fornecedor</td>
            <td>${formatValue(estab.mrp.ressuprimento.compras.fornecedor)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Compras - Qualidade</td>
            <td>${formatValue(estab.mrp.ressuprimento.compras.qualidade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Fábrica - Quantidade</td>
            <td>${formatValue(estab.mrp.ressuprimento.fabrica.quantidade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Fábrica - Qualidade</td>
            <td>${formatValue(estab.mrp.ressuprimento.fabrica.qualidade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Fábrica - Mínimo</td>
            <td>${formatValue(estab.mrp.ressuprimento.fabrica.minimo)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Fábrica - Variação Tempo</td>
            <td>${formatValue(estab.mrp.ressuprimento.fabrica.variacao.tempo)}</td>
          </tr>
          <tr>
            <td>Ressuprimento Fábrica - Variação Quantidade</td>
            <td>${formatValue(estab.mrp.ressuprimento.fabrica.variacao.quantidade)}</td>
          </tr>
        </table>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
