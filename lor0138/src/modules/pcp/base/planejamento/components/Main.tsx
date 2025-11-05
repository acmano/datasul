// src/modules/pcp/base/planejamento/components/Main.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Row, Col, Card, Menu, Select, Button, Tooltip } from 'antd';
import {
  ToolOutlined,
  ReconciliationOutlined,
  CalendarOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { planejamentoService } from '../services/planejamento.service';
import { ItemPlanejamento, EstabelecimentoPlanejamento } from '../types';
import TabLayoutWrapper from '../../../../../shared/components/TabLayoutWrapper';
import { useKeyboardShortcuts } from '../../../../../shared/hooks/useKeyboardShortcuts';

const { Text } = Typography;
const { Option } = Select;

interface PlanejamentoProps {
  selectedItem?: any;
  preloadedData?: ItemPlanejamento | null; // NOVO
}

const Planejamento: React.FC<PlanejamentoProps> = ({ selectedItem, preloadedData }) => {
  const [secaoAtiva, setSecaoAtiva] = useState('producao1');
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<string | null>(null);
  const [planejamento, setPlanejamento] = useState<ItemPlanejamento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const lastLoadedCodeRef = useRef<string>('');

  // Mapeamento de índice para chave de seção
  const secaoKeys = ['producao1', 'producao2', 'reposicao', 'mrp'];

  // Atalhos de teclado
  useKeyboardShortcuts({
    onSubmenuShortcut: (index) => {
      if (index >= 1 && index <= 4) {
        const secaoKey = secaoKeys[index - 1];
        setSecaoAtiva(secaoKey);
      }
    },
    onToggleMenu: () => setMenuVisible((prev) => !prev),
    enabled: !!planejamento,
  });

  useEffect(() => {
    const fetchPlanejamento = async () => {
      if (!selectedItem?.itemCodigo) {
        setPlanejamento(null);
        setEstabelecimentoSelecionado(null);
        lastLoadedCodeRef.current = '';
        return;
      }

      if (lastLoadedCodeRef.current === selectedItem.itemCodigo) {
        return;
      }

      // ✅ SE HOUVER DADOS PRÉ-CARREGADOS, USA ELES
      if (preloadedData && preloadedData.item?.estabelecimento?.length > 0) {
        setPlanejamento(preloadedData);
        setEstabelecimentoSelecionado(preloadedData.item.estabelecimento[0].codigo);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
        return;
      }

      // ❌ FALLBACK: Se não houver pre-fetch, carrega sob demanda
      setLoading(true);
      setError(null);

      try {
        const data = await planejamentoService.getByCode(selectedItem.itemCodigo);

        if (data && data.item.estabelecimento.length > 0) {
          setPlanejamento(data);
          setEstabelecimentoSelecionado(data.item.estabelecimento[0].codigo);
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        } else {
          setError('Planejamento não encontrado para este item');
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error || error?.message || 'Erro ao carregar planejamento do item';
        setError(errorMessage);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
      } finally {
        setLoading(false);
      }
    };

    fetchPlanejamento();
  }, [selectedItem?.itemCodigo, preloadedData]);

  const formatNumber = (value: number | null | undefined, decimals: number = 0): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    return value.toFixed(decimals);
  };

  const formatBoolean = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    return value ? 'Sim' : 'Não';
  };

  const getEstabelecimentoAtual = (): EstabelecimentoPlanejamento | null => {
    if (!planejamento || !estabelecimentoSelecionado) {
      return null;
    }
    return (
      planejamento.item.estabelecimento.find((e) => e.codigo === estabelecimentoSelecionado) || null
    );
  };

  const menuItems = [
    {
      key: 'producao1',
      label: (
        <span className="submenu-with-shortcut">
          Produção 1<span className="submenu-shortcut-hint">Ctrl+Alt+1</span>
        </span>
      ),
      icon: <ToolOutlined />,
    },
    {
      key: 'producao2',
      label: (
        <span className="submenu-with-shortcut">
          Produção 2<span className="submenu-shortcut-hint">Ctrl+Alt+2</span>
        </span>
      ),
      icon: <ReconciliationOutlined />,
    },
    {
      key: 'reposicao',
      label: (
        <span className="submenu-with-shortcut">
          Reposição
          <span className="submenu-shortcut-hint">Ctrl+Alt+3</span>
        </span>
      ),
      icon: <CalendarOutlined />,
    },
    {
      key: 'mrp',
      label: (
        <span className="submenu-with-shortcut">
          MRP
          <span className="submenu-shortcut-hint">Ctrl+Alt+4</span>
        </span>
      ),
      icon: <BarChartOutlined />,
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

  // Botão toggle do menu integrado ao título com Select
  const title = planejamento && (
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
        Item: {planejamento.item.codigo} - {planejamento.item.descricao}
      </Text>
      <Select
        style={{ width: 400 }}
        placeholder="Selecione o estabelecimento"
        value={estabelecimentoSelecionado}
        onChange={setEstabelecimentoSelecionado}
      >
        {planejamento.item.estabelecimento.map((estab) => (
          <Option key={estab.codigo} value={estab.codigo}>
            {estab.codigo} - {estab.nome}
          </Option>
        ))}
      </Select>
    </div>
  );

  const fieldStyle = { marginBottom: 16 };
  const labelStyle = { fontWeight: 'bold' as const, marginBottom: 4, display: 'block' };
  const inputRightStyle = { textAlign: 'right' as const };

  const renderProducao1 = (estab: EstabelecimentoPlanejamento) => (
    <>
      <Card title="Informações Gerais" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Depósito Padrão:</Text>
              <Input value={estab.producao1.depositoPadrao || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Localização:</Text>
              <Input value={estab.producao1.localizacao || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Status:</Text>
              <Input
                value={estab.producao1.status?.toString() || '-'}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Planejador" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Código:</Text>
              <Input value={estab.producao1.planejador.codigo || '-'} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Nome:</Text>
              <Input value={estab.producao1.planejador.nome || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Linha de Produção" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Código:</Text>
              <Input
                value={formatNumber(estab.producao1.linhaProducao.codigo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Nome:</Text>
              <Input value={estab.producao1.linhaProducao.nome || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Chão de Fábrica" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Capacidade Estoque:</Text>
              <Input
                value={formatNumber(estab.producao1.chaoDeFabrica.capacidadeEstoque)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Considera Aloc. Atividades:</Text>
              <Input
                value={formatBoolean(estab.producao1.chaoDeFabrica.consideraAlocAtividades)}
                readOnly
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Programa Aloc. Atividades:</Text>
              <Input
                value={formatBoolean(estab.producao1.chaoDeFabrica.programaAlocAtividades)}
                readOnly
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Percentual Overlap:</Text>
              <Input
                value={formatNumber(estab.producao1.chaoDeFabrica.percentualOverlap)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderProducao2 = (estab: EstabelecimentoPlanejamento) => (
    <>
      <Card title="Reportes e Processos" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Reporta MOB:</Text>
              <Input value={estab.producao2.reportaMOB || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Reporta GGF:</Text>
              <Input value={estab.producao2.reportaGGF || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo Alocação:</Text>
              <Input value={estab.producao2.tipoAlocacao || '-'} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo Requisição:</Text>
              <Input value={estab.producao2.tipoRequisicao || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Processo Custos:</Text>
              <Input value={estab.producao2.processoCustos || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Reporte Produção:</Text>
              <Input value={estab.producao2.reporteProducao || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Refugo" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tratamento Refugo:</Text>
              <Input value={estab.producao2.refugo.tratamentoRefugo || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Controla Estoque:</Text>
              <Input value={estab.producao2.refugo.controlaEstoque || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Preço Fiscal:</Text>
              <Input value={estab.producao2.refugo.precoFiscal || '-'} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Item Refugo - Código:</Text>
              <Input value={estab.producao2.refugo.item.codigo || '-'} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Item Refugo - Descrição:</Text>
              <Input value={estab.producao2.refugo.item.descricao || '-'} readOnly />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Relação Item:</Text>
              <Input
                value={formatNumber(estab.producao2.refugo.relacaoItem, 4)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fator:</Text>
              <Input
                value={formatNumber(estab.producao2.refugo.fator, 4)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Perda:</Text>
              <Input
                value={formatNumber(estab.producao2.refugo.perda, 4)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderReposicao = (estab: EstabelecimentoPlanejamento) => (
    <>
      <Card title="Política de Reposição" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Política:</Text>
              <Input value={estab.reposicao.politica || '-'} readOnly />
            </div>
          </Col>
          <Col span={12}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo Demanda:</Text>
              <Input value={estab.reposicao.tipoDemanda || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Lote" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Múltiplo:</Text>
              <Input
                value={formatNumber(estab.reposicao.lote.multiplo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Mínimo:</Text>
              <Input
                value={formatNumber(estab.reposicao.lote.minimo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Econômico:</Text>
              <Input
                value={formatNumber(estab.reposicao.lote.economico)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Período Fixo:</Text>
              <Input
                value={formatNumber(estab.reposicao.lote.periodoFixo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Ponto Reposição:</Text>
              <Input
                value={formatNumber(estab.reposicao.lote.pontoReposicao)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Estoque Segurança" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Tipo:</Text>
              <Input value={estab.reposicao.estoqueSeguranca.tipo || '-'} readOnly />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Valor:</Text>
              <Input
                value={formatNumber(estab.reposicao.estoqueSeguranca.valor, 4)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Converte Tempo:</Text>
              <Input value={estab.reposicao.estoqueSeguranca.converteTempo || '-'} readOnly />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderMRP = (estab: EstabelecimentoPlanejamento) => (
    <>
      <Card title="Configurações MRP" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Classe Reprogramação:</Text>
              <Input value={estab.mrp.classeReprogramacao || '-'} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Emissão Ordens:</Text>
              <Input value={estab.mrp.emissaoOrdens || '-'} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Divisão Ordens:</Text>
              <Input value={estab.mrp.divisaoOrdens || '-'} readOnly />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Prioridade:</Text>
              <Input value={formatNumber(estab.mrp.prioridade)} readOnly style={inputRightStyle} />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Ressuprimento - Compras" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Quantidade:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.compras.quantidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Fornecedor:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.compras.fornecedor)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Qualidade:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.compras.qualidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Ressuprimento - Fábrica" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Quantidade:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.fabrica.quantidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Qualidade:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.fabrica.qualidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Mínimo:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.fabrica.minimo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Variação Tempo:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.fabrica.variacao.tempo)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={fieldStyle}>
              <Text style={labelStyle}>Variação Quantidade:</Text>
              <Input
                value={formatNumber(estab.mrp.ressuprimento.fabrica.variacao.quantidade)}
                readOnly
                style={inputRightStyle}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderConteudo = () => {
    const estab = getEstabelecimentoAtual();
    if (!estab) {
      return null;
    }

    switch (secaoAtiva) {
      case 'producao1':
        return renderProducao1(estab);
      case 'producao2':
        return renderProducao2(estab);
      case 'reposicao':
        return renderReposicao(estab);
      case 'mrp':
        return renderMRP(estab);
      default:
        return null;
    }
  };

  return (
    <TabLayoutWrapper
      loading={loading}
      error={error}
      isEmpty={!selectedItem}
      emptyMessage="Selecione um item para ver seu planejamento"
      title={title}
      menuContent={planejamento && menuVisible ? menuContent : undefined}
      menuWidth={200}
    >
      {renderConteudo()}
    </TabLayoutWrapper>
  );
};

export default Planejamento;
