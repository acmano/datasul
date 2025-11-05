// src/modules/manufatura/base/components/Main.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Row, Col, Card, Menu, Button, Tooltip } from 'antd';
import {
  ToolOutlined,
  ReloadOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ApiOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { manufaturaService } from '../services/manufatura.service';
import { ItemManufatura } from '../types';
import TabLayoutWrapper from '../../../../shared/components/TabLayoutWrapper';
import { useKeyboardShortcuts } from '../../../../shared/hooks/useKeyboardShortcuts';

const { Text } = Typography;

interface ManufaturaProps {
  selectedItem?: any;
  preloadedData?: ItemManufatura | null;
  onDataLoaded?: (data: ItemManufatura | null) => void;
}

const Manufatura: React.FC<ManufaturaProps> = ({ selectedItem, preloadedData, onDataLoaded }) => {
  const [secaoAtiva, setSecaoAtiva] = useState('gerais');
  const [manufatura, setManufatura] = useState<ItemManufatura | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const lastLoadedCodeRef = useRef<string>('');

  // Mapeamento de índice para chave de seção
  const secaoKeys = ['gerais', 'reposicao', 'mrp', 'pvMpsCrp', 'mes'];

  // Atalhos de teclado
  useKeyboardShortcuts({
    onSubmenuShortcut: (index) => {
      if (index >= 1 && index <= 5) {
        const secaoKey = secaoKeys[index - 1];
        setSecaoAtiva(secaoKey);
      }
    },
    onToggleMenu: () => setMenuVisible((prev) => !prev),
    enabled: !!manufatura,
  });

  // Limpar dados imediatamente quando selectedItem?.itemCodigo muda (para mostrar skeleton)
  useEffect(() => {
    if (lastLoadedCodeRef.current && lastLoadedCodeRef.current !== selectedItem?.itemCodigo) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🧹 Manufatura: limpando dados para mostrar skeleton');
      }
      setManufatura(null);
      onDataLoaded?.(null);
    }
  }, [selectedItem?.itemCodigo, onDataLoaded]);

  useEffect(() => {
    const fetchManufatura = async () => {
      if (!selectedItem?.itemCodigo) {
        setManufatura(null);
        lastLoadedCodeRef.current = '';
        return;
      }

      // ✅ SE HOUVER DADOS PRÉ-CARREGADOS, USA ELES
      if (preloadedData) {
        setManufatura(preloadedData);
        onDataLoaded?.(preloadedData);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
        return;
      }

      // Se não tem preloadedData mas já carregou este código, não recarregar
      if (lastLoadedCodeRef.current === selectedItem.itemCodigo && manufatura) {
        return;
      }

      // ❌ FALLBACK: Se não houver pre-fetch, carrega sob demanda
      setLoading(true);
      setError(null);

      try {
        const data = await manufaturaService.getByCode(selectedItem.itemCodigo);

        if (data) {
          setManufatura(data);
          onDataLoaded?.(data);
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        } else {
          setError('Manufatura não encontrada para este item');
          onDataLoaded?.(null);
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error || error?.message || 'Erro ao carregar manufatura do item';
        setError(errorMessage);
        onDataLoaded?.(null);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
      } finally {
        setLoading(false);
      }
    };

    fetchManufatura();
  }, [selectedItem?.itemCodigo, preloadedData, manufatura, onDataLoaded]);

  // Funções de formatação
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

  const menuItems = [
    {
      key: 'gerais',
      label: (
        <span className="submenu-with-shortcut">
          Gerais
          <span className="submenu-shortcut-hint">Ctrl+Alt+1</span>
        </span>
      ),
      icon: <ToolOutlined />,
    },
    {
      key: 'reposicao',
      label: (
        <span className="submenu-with-shortcut">
          Reposição
          <span className="submenu-shortcut-hint">Ctrl+Alt+2</span>
        </span>
      ),
      icon: <ReloadOutlined />,
    },
    {
      key: 'mrp',
      label: (
        <span className="submenu-with-shortcut">
          MRP
          <span className="submenu-shortcut-hint">Ctrl+Alt+3</span>
        </span>
      ),
      icon: <LineChartOutlined />,
    },
    {
      key: 'pvMpsCrp',
      label: (
        <span className="submenu-with-shortcut">
          PV/MPS/CRP
          <span className="submenu-shortcut-hint">Ctrl+Alt+4</span>
        </span>
      ),
      icon: <BarChartOutlined />,
    },
    {
      key: 'mes',
      label: (
        <span className="submenu-with-shortcut">
          MES
          <span className="submenu-shortcut-hint">Ctrl+Alt+5</span>
        </span>
      ),
      icon: <ApiOutlined />,
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
  const title = manufatura && (
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
        Item: {manufatura.item.codigo} - {manufatura.item.descricao}
      </Text>
    </div>
  );

  const fieldStyle = { marginBottom: 16 };
  const labelStyle = { fontWeight: 'bold' as const, marginBottom: 4, display: 'block' };
  const inputRightStyle = { textAlign: 'right' as const };

  const renderGerais = () => (
    <Card title="Informações Gerais" size="small">
      <Row gutter={16}>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Situação:</Text>
            <Input value={manufatura?.item.gerais.situacao || '-'} readOnly />
          </div>
        </Col>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Tipo Controle:</Text>
            <Input value={manufatura?.item.gerais.tipoControle || '-'} readOnly />
          </div>
        </Col>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Tipo Controle Estoque:</Text>
            <Input value={manufatura?.item.gerais.tipoControleEstoque || '-'} readOnly />
          </div>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Tipo Requisição:</Text>
            <Input value={manufatura?.item.gerais.tipoRequisicao || '-'} readOnly />
          </div>
        </Col>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Considera Alocação Atividades:</Text>
            <Input value={manufatura?.item.gerais.consideraAlocacaoAtividades || '-'} readOnly />
          </div>
        </Col>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Programa Alocação Atividades:</Text>
            <Input value={manufatura?.item.gerais.programaAlocacaoAtividades || '-'} readOnly />
          </div>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <div style={fieldStyle}>
            <Text style={labelStyle}>Taxa Overlap (%):</Text>
            <Input
              value={formatPercent(manufatura?.item.gerais.taxaOverlap)}
              readOnly
              style={inputRightStyle}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderReposicao = () => (
    <>
      <Card title="Política" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Política:</Text>
              <Input value={manufatura?.item.reposicao.politica || '-'} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo Demanda:</Text>
              <Input value={manufatura?.item.reposicao.tipoDemanda || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Lote" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Múltiplo:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.lote.multiplo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Mínimo:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.lote.minimo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Econômico:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.lote.economico)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Estoque Segurança" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo:</Text>
              <Input value={manufatura?.item.reposicao.estoqueSeguranca.tipo || '-'} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Quantidade:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.estoqueSeguranca.quantidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tempo:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.estoqueSeguranca.tempo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Converte Tempo:</Text>
              <Input
                value={manufatura?.item.reposicao.estoqueSeguranca.converteTempo || '-'}
                readOnly
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Reabastecimento:</Text>
              <Input
                value={manufatura?.item.reposicao.estoqueSeguranca.reabastecimento || '-'}
                readOnly
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Outros" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Período Fixo:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.periodoFixo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Ponto Reposição:</Text>
              <Input
                value={formatInteger(manufatura?.item.reposicao.pontoReposicao)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fator Refugo (%):</Text>
              <Input
                value={formatPercent(manufatura?.item.reposicao.fatorRefugo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Quantidade Perda:</Text>
              <Input
                value={formatDecimal(manufatura?.item.reposicao.quantidadePerda, 4)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderMRP = () => (
    <>
      <Card title="Configurações MRP" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Classe Reprogramação:</Text>
              <Input value={manufatura?.item.mrp.classeReprogramacao || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Emissão Ordens:</Text>
              <Input value={manufatura?.item.mrp.emissaoOrdens || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Controle Planejamento:</Text>
              <Input value={manufatura?.item.mrp.controlePlanejamento || '-'} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Divisão Ordens:</Text>
              <Input value={manufatura?.item.mrp.divisaoOrdens || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Processo:</Text>
              <Input value={manufatura?.item.mrp.processo || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Represa Demanda:</Text>
              <Input value={manufatura?.item.mrp.represaDemanda || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Ressuprimento" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Compras:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.compras)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fornecedor:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.fornecedor)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Qualidade:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.qualidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fábrica:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.fabrica)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fábrica Qualidade:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.fabricaQualidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Mínimo:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.minimo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Variação Tempo:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.variacaoTempo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Quantidade:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.quantidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Horizonte Liberação:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.horizonteLiberacao)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Horizonte Fixo:</Text>
              <Input
                value={formatInteger(manufatura?.item.mrp.ressuprimento.horizonteFixo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderPvMpsCrp = () => (
    <>
      <Card title="PV (Planejamento de Vendas)" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Origem:</Text>
              <Input value={manufatura?.item.pvMpsCrp.pV.origem || '-'} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fórmula:</Text>
              <Input value={manufatura?.item.pvMpsCrp.pV.formula || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="MPS (Master Production Schedule)" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Critério Cálculo:</Text>
              <Input value={manufatura?.item.pvMpsCrp.MPS.criterioCalculo || '-'} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fator Custo Distribuição (%):</Text>
              <Input
                value={formatPercent(manufatura?.item.pvMpsCrp.MPS.fatorCustoDistribuicao)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="CRP (Capacity Requirements Planning)" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Prioridade:</Text>
              <Input
                value={formatInteger(manufatura?.item.pvMpsCrp.CRP.prioridade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Programação:</Text>
              <Input value={manufatura?.item.pvMpsCrp.CRP.programacao || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderMES = () => (
    <Card title="MES (Manufacturing Execution System)" size="small">
      <Row gutter={16}>
        <Col span={24}>
          <div style={fieldStyle}>
            <Text type="secondary">Nenhum dado disponível para MES</Text>
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderConteudo = () => {
    if (!manufatura) {
      return null;
    }

    switch (secaoAtiva) {
      case 'gerais':
        return renderGerais();
      case 'reposicao':
        return renderReposicao();
      case 'mrp':
        return renderMRP();
      case 'pvMpsCrp':
        return renderPvMpsCrp();
      case 'mes':
        return renderMES();
      default:
        return null;
    }
  };

  return (
    <TabLayoutWrapper
      loading={loading}
      error={error}
      isEmpty={!selectedItem}
      emptyMessage="Selecione um item para ver sua manufatura"
      title={title}
      menuContent={manufatura && menuVisible ? menuContent : undefined}
      menuWidth={200}
    >
      {renderConteudo()}
    </TabLayoutWrapper>
  );
};

export default Manufatura;
