// src/modules/manufatura/base/utils/export/print.ts

import { ItemManufatura } from '../../types';

const formatInteger = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return Math.floor(value).toString();
};

const formatDecimal = (value: number | null | undefined, decimals: number): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value.toFixed(decimals);
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value.toFixed(2) + '%';
};

export const printManufatura = (manufatura: ItemManufatura) => {
  if (!manufatura) {
    alert('Não há dados para imprimir');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Manufatura - ${manufatura.item.codigo}</title>
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
      <h1>Manufatura do Item</h1>
      <p><strong>Item:</strong> ${manufatura.item.codigo} - ${manufatura.item.descricao}</p>

      <div class="section">
        <h2>Informações Gerais</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Situação</td>
            <td>${manufatura.item.gerais.situacao || '-'}</td>
          </tr>
          <tr>
            <td>Tipo Controle</td>
            <td>${manufatura.item.gerais.tipoControle || '-'}</td>
          </tr>
          <tr>
            <td>Tipo Controle Estoque</td>
            <td>${manufatura.item.gerais.tipoControleEstoque || '-'}</td>
          </tr>
          <tr>
            <td>Tipo Requisição</td>
            <td>${manufatura.item.gerais.tipoRequisicao || '-'}</td>
          </tr>
          <tr>
            <td>Considera Alocação Atividades</td>
            <td>${manufatura.item.gerais.consideraAlocacaoAtividades || '-'}</td>
          </tr>
          <tr>
            <td>Programa Alocação Atividades</td>
            <td>${manufatura.item.gerais.programaAlocacaoAtividades || '-'}</td>
          </tr>
          <tr>
            <td>Taxa Overlap</td>
            <td>${formatPercent(manufatura.item.gerais.taxaOverlap)}</td>
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
            <td>${manufatura.item.reposicao.politica || '-'}</td>
          </tr>
          <tr>
            <td>Tipo Demanda</td>
            <td>${manufatura.item.reposicao.tipoDemanda || '-'}</td>
          </tr>
          <tr>
            <td>Lote Múltiplo</td>
            <td>${formatInteger(manufatura.item.reposicao.lote.multiplo)}</td>
          </tr>
          <tr>
            <td>Lote Mínimo</td>
            <td>${formatInteger(manufatura.item.reposicao.lote.minimo)}</td>
          </tr>
          <tr>
            <td>Lote Econômico</td>
            <td>${formatInteger(manufatura.item.reposicao.lote.economico)}</td>
          </tr>
          <tr>
            <td>Estoque Segurança - Tipo</td>
            <td>${manufatura.item.reposicao.estoqueSeguranca.tipo || '-'}</td>
          </tr>
          <tr>
            <td>Estoque Segurança - Quantidade</td>
            <td>${formatInteger(manufatura.item.reposicao.estoqueSeguranca.quantidade)}</td>
          </tr>
          <tr>
            <td>Estoque Segurança - Tempo</td>
            <td>${formatInteger(manufatura.item.reposicao.estoqueSeguranca.tempo)}</td>
          </tr>
          <tr>
            <td>Converte Tempo</td>
            <td>${manufatura.item.reposicao.estoqueSeguranca.converteTempo || '-'}</td>
          </tr>
          <tr>
            <td>Reabastecimento</td>
            <td>${manufatura.item.reposicao.estoqueSeguranca.reabastecimento || '-'}</td>
          </tr>
          <tr>
            <td>Período Fixo</td>
            <td>${formatInteger(manufatura.item.reposicao.periodoFixo)}</td>
          </tr>
          <tr>
            <td>Ponto Reposição</td>
            <td>${formatInteger(manufatura.item.reposicao.pontoReposicao)}</td>
          </tr>
          <tr>
            <td>Fator Refugo</td>
            <td>${formatPercent(manufatura.item.reposicao.fatorRefugo)}</td>
          </tr>
          <tr>
            <td>Quantidade Perda</td>
            <td>${formatDecimal(manufatura.item.reposicao.quantidadePerda, 4)}</td>
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
            <td>${manufatura.item.mrp.classeReprogramacao || '-'}</td>
          </tr>
          <tr>
            <td>Emissão Ordens</td>
            <td>${manufatura.item.mrp.emissaoOrdens || '-'}</td>
          </tr>
          <tr>
            <td>Controle Planejamento</td>
            <td>${manufatura.item.mrp.controlePlanejamento || '-'}</td>
          </tr>
          <tr>
            <td>Divisão Ordens</td>
            <td>${manufatura.item.mrp.divisaoOrdens || '-'}</td>
          </tr>
          <tr>
            <td>Processo</td>
            <td>${manufatura.item.mrp.processo || '-'}</td>
          </tr>
          <tr>
            <td>Represa Demanda</td>
            <td>${manufatura.item.mrp.represaDemanda || '-'}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Compras</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.compras)}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Fornecedor</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.fornecedor)}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Qualidade</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.qualidade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Fábrica</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.fabrica)}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Fábrica Qualidade</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.fabricaQualidade)}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Mínimo</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.minimo)}</td>
          </tr>
          <tr>
            <td>Variação Tempo</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.variacaoTempo)}</td>
          </tr>
          <tr>
            <td>Ressuprimento - Quantidade</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.quantidade)}</td>
          </tr>
          <tr>
            <td>Horizonte Liberação</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.horizonteLiberacao)}</td>
          </tr>
          <tr>
            <td>Horizonte Fixo</td>
            <td>${formatInteger(manufatura.item.mrp.ressuprimento.horizonteFixo)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>PV/MPS/CRP</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>PV - Origem</td>
            <td>${manufatura.item.pvMpsCrp.pV.origem || '-'}</td>
          </tr>
          <tr>
            <td>PV - Fórmula</td>
            <td>${manufatura.item.pvMpsCrp.pV.formula || '-'}</td>
          </tr>
          <tr>
            <td>MPS - Critério Cálculo</td>
            <td>${manufatura.item.pvMpsCrp.MPS.criterioCalculo || '-'}</td>
          </tr>
          <tr>
            <td>MPS - Fator Custo Distribuição</td>
            <td>${formatPercent(manufatura.item.pvMpsCrp.MPS.fatorCustoDistribuicao)}</td>
          </tr>
          <tr>
            <td>CRP - Prioridade</td>
            <td>${formatInteger(manufatura.item.pvMpsCrp.CRP.prioridade)}</td>
          </tr>
          <tr>
            <td>CRP - Programação</td>
            <td>${manufatura.item.pvMpsCrp.CRP.programacao || '-'}</td>
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
