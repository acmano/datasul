// src/modules/item/dadosCadastrais/fiscal/utils/export/print.ts

import { ItemFiscal } from '../../types';

export const printFiscal = (fiscal: ItemFiscal) => {
  if (!fiscal) {
    alert('Não há dados para imprimir');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return value.toString();
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dados Fiscais - ${fiscal.item.codigo}</title>
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
      <h1>Dados Fiscais do Item</h1>
      <p><strong>Item:</strong> ${fiscal.item.codigo} - ${fiscal.item.descricao}</p>

      <div class="section">
        <h2>Informações Gerais</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Forma Descrição</td>
            <td>${formatValue(fiscal.item.gerais.formaDescricao)}</td>
          </tr>
          <tr>
            <td>Forma Obtenção</td>
            <td>${formatValue(fiscal.item.gerais.formaObtencao)}</td>
          </tr>
          <tr>
            <td>Quantidade Fracionada</td>
            <td>${formatValue(fiscal.item.gerais.quantidadeFracionada)}</td>
          </tr>
          <tr>
            <td>Lote Múltiplo</td>
            <td>${formatValue(fiscal.item.gerais.loteMultiplo)}</td>
          </tr>
          <tr>
            <td>Unidade Negócio</td>
            <td>${fiscal.item.gerais.unidadeNegocio.codigo} - ${fiscal.item.gerais.unidadeNegocio.nome}</td>
          </tr>
          <tr>
            <td>Origem Unid. Trib</td>
            <td>${formatValue(fiscal.item.gerais.origemUnidTrib)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Informações Complementares</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Tipo Controle</td>
            <td>${formatValue(fiscal.item.complementares.tipoControle)}</td>
          </tr>
          <tr>
            <td>Tipo Controle Estoque</td>
            <td>${formatValue(fiscal.item.complementares.tipoControleEstoque)}</td>
          </tr>
          <tr>
            <td>Emissão NF</td>
            <td>${formatValue(fiscal.item.complementares.emissaoNF)}</td>
          </tr>
          <tr>
            <td>Faturável</td>
            <td>${formatValue(fiscal.item.complementares.faturavel)}</td>
          </tr>
          <tr>
            <td>Baixa Estoque</td>
            <td>${formatValue(fiscal.item.complementares.baixaEstoque)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Informações Fiscais</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Serviço</td>
            <td>${formatValue(fiscal.item.fiscal.servico)}</td>
          </tr>
          <tr>
            <td>DCR</td>
            <td>${formatValue(fiscal.item.fiscal.DCR)}</td>
          </tr>
          <tr>
            <td>SEFAZ SP</td>
            <td>${formatValue(fiscal.item.fiscal.sefazSP)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Classificação Fiscal</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Código</td>
            <td>${formatValue(fiscal.item.fiscal.classificacao.codigo)}</td>
          </tr>
          <tr>
            <td>NCM</td>
            <td>${formatValue(fiscal.item.fiscal.classificacao.ncm)}</td>
          </tr>
          <tr>
            <td>Nome</td>
            <td>${formatValue(fiscal.item.fiscal.classificacao.nome)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>IPI</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Código Tributação</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.codigoTributacao)}</td>
          </tr>
          <tr>
            <td>Alíquota</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.aliquota)}</td>
          </tr>
          <tr>
            <td>Apuração</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.apuracao)}</td>
          </tr>
          <tr>
            <td>Suspenso</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.suspenso)}</td>
          </tr>
          <tr>
            <td>Diferenciado</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.diferenciado)}</td>
          </tr>
          <tr>
            <td>Incentivado</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.incentivado)}</td>
          </tr>
          <tr>
            <td>Combustível/Solvente</td>
            <td>${formatValue(fiscal.item.fiscal.ipi.combustivelSolvente)}</td>
          </tr>
          <tr>
            <td>Família</td>
            <td>${fiscal.item.fiscal.ipi.familia.codigo} - ${fiscal.item.fiscal.ipi.familia.nome}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>ICMS</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Código Tributação</td>
            <td>${formatValue(fiscal.item.fiscal.icms.codigoTributacao)}</td>
          </tr>
          <tr>
            <td>Fator Reajuste</td>
            <td>${formatValue(fiscal.item.fiscal.icms.fatorReajuste)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>ISS</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Código</td>
            <td>${formatValue(fiscal.item.fiscal.iss.codigo)}</td>
          </tr>
          <tr>
            <td>Alíquota</td>
            <td>${formatValue(fiscal.item.fiscal.iss.aliquota)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>INSS</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Serviço Código</td>
            <td>${formatValue(fiscal.item.fiscal.inss.servicoCodigo)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>PIS</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Cálculo Por Unidade</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.calculoPorUnidade)}</td>
          </tr>
          <tr>
            <td>Valor Por Unidade</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.valorPorUnidade)}</td>
          </tr>
          <tr>
            <td>Alíquota Origem</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.aliquotaOrigem)}</td>
          </tr>
          <tr>
            <td>Alíquota</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.aliquota)}</td>
          </tr>
          <tr>
            <td>Percentual Redução</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.percentualReducao)}</td>
          </tr>
          <tr>
            <td>Retenção - Percentual</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.retencao.percentual)}</td>
          </tr>
          <tr>
            <td>Retenção - Origem</td>
            <td>${formatValue(fiscal.item.pisCofins.pis.retencao.origem)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>COFINS</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Cálculo Por Unidade</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.calculoPorUnidade)}</td>
          </tr>
          <tr>
            <td>Valor Por Unidade</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.valorPorUnidade)}</td>
          </tr>
          <tr>
            <td>Alíquota Origem</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.aliquotaOrigem)}</td>
          </tr>
          <tr>
            <td>Alíquota</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.aliquota)}</td>
          </tr>
          <tr>
            <td>Percentual Redução</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.percentualReducao)}</td>
          </tr>
          <tr>
            <td>Retenção - Percentual</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.retencao.percentual)}</td>
          </tr>
          <tr>
            <td>Retenção - Origem</td>
            <td>${formatValue(fiscal.item.pisCofins.cofins.retencao.origem)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>CSLL</h2>
        <table>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Retenção - Origem</td>
            <td>${formatValue(fiscal.item.pisCofins.retencaoCsll.origem)}</td>
          </tr>
          <tr>
            <td>Retenção - Percentual</td>
            <td>${formatValue(fiscal.item.pisCofins.retencaoCsll.percentual)}</td>
          </tr>
          <tr>
            <td>Subst. Total NF</td>
            <td>${formatValue(fiscal.item.pisCofins.substTotalNF)}</td>
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
