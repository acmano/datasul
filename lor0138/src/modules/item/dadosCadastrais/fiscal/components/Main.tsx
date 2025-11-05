// src/modules/item/dadosCadastrais/fiscal/components/Main.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Row, Col, Card, Menu, Button, Tooltip } from 'antd';
import {
  FileTextOutlined,
  DollarOutlined,
  CalculatorOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { fiscalService } from '../services/fiscal.service';
import { ItemFiscal } from '../types';
import TabLayoutWrapper from '../../../../../shared/components/TabLayoutWrapper';
import { useKeyboardShortcuts } from '../../../../../shared/hooks/useKeyboardShortcuts';

const { Text } = Typography;

interface FiscalProps {
  selectedItem?: any;
  preloadedData?: ItemFiscal | null;
}

const Fiscal: React.FC<FiscalProps> = ({ selectedItem, preloadedData }) => {
  const [secaoAtiva, setSecaoAtiva] = useState('gerais');
  const [fiscal, setFiscal] = useState<ItemFiscal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const lastLoadedCodeRef = useRef<string>('');

  // Mapeamento de índice para chave de seção
  const secaoKeys = ['gerais', 'tributacao', 'pisCofins'];

  // Atalhos de teclado
  useKeyboardShortcuts({
    onSubmenuShortcut: (index) => {
      if (index >= 1 && index <= 3) {
        const secaoKey = secaoKeys[index - 1];
        setSecaoAtiva(secaoKey);
      }
    },
    onToggleMenu: () => setMenuVisible((prev) => !prev),
    enabled: !!fiscal,
  });

  // Limpar dados imediatamente quando selectedItem?.itemCodigo muda (para mostrar skeleton)
  useEffect(() => {
    if (lastLoadedCodeRef.current && lastLoadedCodeRef.current !== selectedItem?.itemCodigo) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🧹 Fiscal: limpando dados para mostrar skeleton');
      }
      setFiscal(null);
    }
  }, [selectedItem?.itemCodigo]);

  useEffect(() => {
    const fetchFiscal = async () => {
      if (!selectedItem?.itemCodigo) {
        setFiscal(null);
        lastLoadedCodeRef.current = '';
        return;
      }

      // ✅ SE HOUVER DADOS PRÉ-CARREGADOS, USA ELES
      if (preloadedData) {
        setFiscal(preloadedData);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
        return;
      }

      // Se não tem preloadedData mas já carregou este código, não recarregar
      if (lastLoadedCodeRef.current === selectedItem.itemCodigo && fiscal) {
        return;
      }

      // ❌ FALLBACK: Se não houver pre-fetch, carrega sob demanda
      setLoading(true);
      setError(null);

      try {
        const data = await fiscalService.getByCode(selectedItem.itemCodigo);

        if (data) {
          setFiscal(data);
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        } else {
          setError('Dados fiscais não encontrados para este item');
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error ||
          error?.message ||
          'Erro ao carregar dados fiscais do item';
        setError(errorMessage);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
      } finally {
        setLoading(false);
      }
    };

    fetchFiscal();
  }, [selectedItem?.itemCodigo, preloadedData, fiscal]);

  const formatValue = (value: string | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return value;
  };

  const menuItems = [
    {
      key: 'gerais',
      label: (
        <span className="submenu-with-shortcut">
          Gerais
          <span className="submenu-shortcut-hint">Ctrl+Alt+1</span>
        </span>
      ),
      icon: <FileTextOutlined />,
    },
    {
      key: 'tributacao',
      label: (
        <span className="submenu-with-shortcut">
          Tributação
          <span className="submenu-shortcut-hint">Ctrl+Alt+2</span>
        </span>
      ),
      icon: <DollarOutlined />,
    },
    {
      key: 'pisCofins',
      label: (
        <span className="submenu-with-shortcut">
          PIS/COFINS
          <span className="submenu-shortcut-hint">Ctrl+Alt+3</span>
        </span>
      ),
      icon: <CalculatorOutlined />,
    },
  ];

  const menuContent = (
    <>
      <style>{`
        .submenu-with-shortcut {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .submenu-shortcut-hint {
          font-size: 10px;
          opacity: 0;
          transition: opacity 0.2s;
          margin-left: 8px;
          color: #8c8c8c;
        }

        .ant-menu-item:hover .submenu-shortcut-hint,
        .ant-menu-item-selected .submenu-shortcut-hint {
          opacity: 0.7;
        }
      `}</style>
      <Menu
        mode="inline"
        selectedKeys={[secaoAtiva]}
        items={menuItems}
        onClick={({ key }) => setSecaoAtiva(key)}
        style={{ height: '100%', borderRight: 0 }}
      />
    </>
  );

  // Botão toggle do menu integrado ao título
  const title = fiscal && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Tooltip title={menuVisible ? 'Esconder menu (Ctrl+Alt+0)' : 'Mostrar menu (Ctrl+Alt+0)'}>
        <Button
          type="text"
          size="small"
          icon={menuVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setMenuVisible((prev) => !prev)}
        />
      </Tooltip>
      <Text strong style={{ fontSize: 16 }}>
        Item: {fiscal.item.codigo} - {fiscal.item.descricao}
      </Text>
    </div>
  );

  const fieldStyle = { marginBottom: 16 };
  const labelStyle = { fontWeight: 'bold' as const, marginBottom: 4, display: 'block' };

  const renderGerais = () => (
    <>
      <Card title="Informações Gerais" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Forma Descrição:</Text>
              <Input value={formatValue(fiscal?.item.gerais.formaDescricao)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Forma Obtenção:</Text>
              <Input value={formatValue(fiscal?.item.gerais.formaObtencao)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Quantidade Fracionada:</Text>
              <Input value={formatValue(fiscal?.item.gerais.quantidadeFracionada)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Lote Múltiplo:</Text>
              <Input value={formatValue(fiscal?.item.gerais.loteMultiplo)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Unidade Negócio - Código:</Text>
              <Input value={formatValue(fiscal?.item.gerais.unidadeNegocio.codigo)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Unidade Negócio - Nome:</Text>
              <Input value={formatValue(fiscal?.item.gerais.unidadeNegocio.nome)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Origem Unid. Trib:</Text>
              <Input value={formatValue(fiscal?.item.gerais.origemUnidTrib)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Informações Complementares" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo Controle:</Text>
              <Input value={formatValue(fiscal?.item.complementares.tipoControle)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo Controle Estoque:</Text>
              <Input
                value={formatValue(fiscal?.item.complementares.tipoControleEstoque)}
                readOnly
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Emissão NF:</Text>
              <Input value={formatValue(fiscal?.item.complementares.emissaoNF)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Faturável:</Text>
              <Input value={formatValue(fiscal?.item.complementares.faturavel)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Baixa Estoque:</Text>
              <Input value={formatValue(fiscal?.item.complementares.baixaEstoque)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderTributacao = () => (
    <>
      <Card title="Informações Fiscais" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Serviço:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.servico)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>DCR:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.DCR)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>SEFAZ SP:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.sefazSP)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Classificação Fiscal" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Código:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.classificacao.codigo)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>NCM:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.classificacao.ncm)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Nome:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.classificacao.nome)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="IPI" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Código Tributação:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.codigoTributacao)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Alíquota:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.aliquota)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Apuração:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.apuracao)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Suspenso:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.suspenso)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Diferenciado:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.diferenciado)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Incentivado:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.incentivado)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Combustível/Solvente:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.combustivelSolvente)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Família - Código:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.familia.codigo)} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Família - Nome:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.ipi.familia.nome)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="ICMS" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Código Tributação:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.icms.codigoTributacao)} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fator Reajuste:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.icms.fatorReajuste)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="ISS" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Código:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.iss.codigo)} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Alíquota:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.iss.aliquota)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="INSS" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Serviço Código:</Text>
              <Input value={formatValue(fiscal?.item.fiscal.inss.servicoCodigo)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderPisCofins = () => (
    <>
      <Card title="PIS" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Cálculo Por Unidade:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.calculoPorUnidade)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Valor Por Unidade:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.valorPorUnidade)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Alíquota Origem:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.aliquotaOrigem)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Alíquota:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.aliquota)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Percentual Redução:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.percentualReducao)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Retenção - Percentual:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.retencao.percentual)} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Retenção - Origem:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.pis.retencao.origem)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="COFINS" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Cálculo Por Unidade:</Text>
              <Input
                value={formatValue(fiscal?.item.pisCofins.cofins.calculoPorUnidade)}
                readOnly
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Valor Por Unidade:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.cofins.valorPorUnidade)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Alíquota Origem:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.cofins.aliquotaOrigem)} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Alíquota:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.cofins.aliquota)} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Percentual Redução:</Text>
              <Input
                value={formatValue(fiscal?.item.pisCofins.cofins.percentualReducao)}
                readOnly
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Retenção - Percentual:</Text>
              <Input
                value={formatValue(fiscal?.item.pisCofins.cofins.retencao.percentual)}
                readOnly
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Retenção - Origem:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.cofins.retencao.origem)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="CSLL" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Retenção - Origem:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.retencaoCsll.origem)} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Retenção - Percentual:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.retencaoCsll.percentual)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Outros" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Subst. Total NF:</Text>
              <Input value={formatValue(fiscal?.item.pisCofins.substTotalNF)} readOnly />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderConteudo = () => {
    if (!fiscal) {
      return null;
    }

    switch (secaoAtiva) {
      case 'gerais':
        return renderGerais();
      case 'tributacao':
        return renderTributacao();
      case 'pisCofins':
        return renderPisCofins();
      default:
        return null;
    }
  };

  // Está carregando se: loading ativo OU (tem código mas não tem dados ainda)
  const isLoading = loading || (!!selectedItem?.itemCodigo && !fiscal);

  return (
    <TabLayoutWrapper
      loading={isLoading}
      error={error}
      isEmpty={!selectedItem}
      emptyMessage="Selecione um item para ver seus dados fiscais"
      title={title}
      menuContent={fiscal && menuVisible ? menuContent : undefined}
      menuWidth={200}
    >
      {renderConteudo()}
    </TabLayoutWrapper>
  );
};

export default Fiscal;
