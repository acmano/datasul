// src/modules/item/dadosCadastrais/dimensoes/components/Main.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Row, Col, Card, Menu, Button, Tooltip } from 'antd';
import {
  BuildOutlined,
  InboxOutlined,
  GiftOutlined,
  BoxPlotOutlined,
  ContainerOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { dimensoesService } from '../services/dimensoes.service';
import { ItemDimensoes } from '../types';
import BarcodeDisplay from '../../../../../shared/components/BarcodeDisplay';
import TabLayoutWrapper from '../../../../../shared/components/TabLayoutWrapper';
import { useKeyboardShortcuts } from '../../../../../shared/hooks/useKeyboardShortcuts';

const { Text } = Typography;

interface DimensoesProps {
  selectedItem?: any;
  preloadedData?: ItemDimensoes | null; // NOVO
}

const Dimensoes: React.FC<DimensoesProps> = ({ selectedItem, preloadedData }) => {
  const [secaoAtiva, setSecaoAtiva] = useState('peca');
  const [dimensoes, setDimensoes] = useState<ItemDimensoes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const lastLoadedCodeRef = useRef<string>('');

  // Mapeamento de índice para chave de seção
  const secaoKeys = ['peca', 'item', 'produto', 'embalagem', 'palete'];

  // Atalhos de teclado
  useKeyboardShortcuts({
    onSubmenuShortcut: (index) => {
      if (index >= 1 && index <= 5) {
        const secaoKey = secaoKeys[index - 1];
        setSecaoAtiva(secaoKey);
      }
    },
    onToggleMenu: () => setMenuVisible((prev) => !prev),
    enabled: !!dimensoes,
  });

  // Limpar dados imediatamente quando selectedItem?.itemCodigo muda (para mostrar skeleton)
  useEffect(() => {
    if (lastLoadedCodeRef.current && lastLoadedCodeRef.current !== selectedItem?.itemCodigo) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🧹 Dimensoes: limpando dados para mostrar skeleton');
      }
      setDimensoes(null);
    }
  }, [selectedItem?.itemCodigo]);

  useEffect(() => {
    const fetchDimensoes = async () => {
      if (!selectedItem?.itemCodigo) {
        setDimensoes(null);
        lastLoadedCodeRef.current = '';
        return;
      }

      // ✅ SE HOUVER DADOS PRÉ-CARREGADOS, USA ELES
      if (preloadedData) {
        setDimensoes(preloadedData);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
        return;
      }

      // Se não tem preloadedData mas já carregou este código, não recarregar
      if (lastLoadedCodeRef.current === selectedItem.itemCodigo && dimensoes) {
        return;
      }

      // ❌ FALLBACK: Se não houver pre-fetch, carrega sob demanda
      setLoading(true);
      setError(null);

      try {
        const data = await dimensoesService.getByCode(selectedItem.itemCodigo);

        if (data) {
          setDimensoes(data);
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        } else {
          setError('Dimensões não encontradas para este item');
          lastLoadedCodeRef.current = selectedItem.itemCodigo;
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error || error?.message || 'Erro ao carregar dimensões do item';
        setError(errorMessage);
        lastLoadedCodeRef.current = selectedItem.itemCodigo;
      } finally {
        setLoading(false);
      }
    };

    fetchDimensoes();
  }, [selectedItem?.itemCodigo, preloadedData, dimensoes]);

  const formatNumber = (value: number | undefined | null, decimals: number = 4): string => {
    if (value === undefined || value === null || value === 0) {
      return '0.0000';
    }
    return value.toFixed(decimals);
  };

  const menuItems = [
    {
      key: 'peca',
      label: (
        <span className="submenu-with-shortcut">
          Peça
          <span className="submenu-shortcut-hint">Ctrl+Alt+1</span>
        </span>
      ),
      icon: <BuildOutlined />,
    },
    {
      key: 'item',
      label: (
        <span className="submenu-with-shortcut">
          Item
          <span className="submenu-shortcut-hint">Ctrl+Alt+2</span>
        </span>
      ),
      icon: <InboxOutlined />,
    },
    {
      key: 'produto',
      label: (
        <span className="submenu-with-shortcut">
          Produto
          <span className="submenu-shortcut-hint">Ctrl+Alt+3</span>
        </span>
      ),
      icon: <GiftOutlined />,
    },
    {
      key: 'embalagem',
      label: (
        <span className="submenu-with-shortcut">
          Embalagem (Caixa)
          <span className="submenu-shortcut-hint">Ctrl+Alt+4</span>
        </span>
      ),
      icon: <BoxPlotOutlined />,
    },
    {
      key: 'palete',
      label: (
        <span className="submenu-with-shortcut">
          Palete
          <span className="submenu-shortcut-hint">Ctrl+Alt+5</span>
        </span>
      ),
      icon: <ContainerOutlined />,
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
  const title = dimensoes && (
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
        Item: {dimensoes.itemCodigo} - {dimensoes.itemDescricao}
      </Text>
    </div>
  );

  const fieldStyle = { marginBottom: 16 };
  const labelStyle = { fontWeight: 'bold' as const, marginBottom: 4, display: 'block' };
  const inputStyle = { textAlign: 'right' as const };

  const renderConteudo = () => {
    if (!dimensoes) {
      return null;
    }

    switch (secaoAtiva) {
      case 'peca':
        return (
          <Card title="Dimensões da Peça" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Altura:</Text>
                  <Input
                    value={formatNumber(dimensoes.peca.altura)}
                    readOnly
                    addonAfter="m"
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Largura:</Text>
                  <Input
                    value={formatNumber(dimensoes.peca.largura)}
                    readOnly
                    addonAfter="m"
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Profundidade:</Text>
                  <Input
                    value={formatNumber(dimensoes.peca.profundidade)}
                    readOnly
                    addonAfter="m"
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Peso:</Text>
                  <Input
                    value={formatNumber(dimensoes.peca.peso)}
                    readOnly
                    addonAfter="kg"
                    style={inputStyle}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        );

      case 'item':
        return (
          <>
            <Card title="Item - Embalagem" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Altura:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalagem.altura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Largura:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalagem.largura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Profundidade:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalagem.profundidade)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Peso:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalagem.peso)}
                      readOnly
                      addonAfter="kg"
                      style={inputStyle}
                    />
                  </div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Peças por Item:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.pecas, 0)}
                      readOnly
                      style={inputStyle}
                    />
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="Item - Embalado" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Altura:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalado.altura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Largura:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalado.largura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Profundidade:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalado.profundidade)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Peso:</Text>
                    <Input
                      value={formatNumber(dimensoes.item.embalado.peso)}
                      readOnly
                      addonAfter="kg"
                      style={inputStyle}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </>
        );

      case 'produto':
        return (
          <>
            <Card title="Produto - Embalagem" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Altura:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalagem.altura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Largura:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalagem.largura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Profundidade:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalagem.profundidade)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Peso:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalagem.peso)}
                      readOnly
                      addonAfter="kg"
                      style={inputStyle}
                    />
                  </div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Itens por Produto:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.itens, 0)}
                      readOnly
                      style={inputStyle}
                    />
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="Produto - Embalado" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Altura:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalado.altura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Largura:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalado.largura)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Profundidade:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalado.profundidade)}
                      readOnly
                      addonAfter="m"
                      style={inputStyle}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Peso:</Text>
                    <Input
                      value={formatNumber(dimensoes.produto.embalado.peso)}
                      readOnly
                      addonAfter="kg"
                      style={inputStyle}
                    />
                  </div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>GTIN-13 (EAN):</Text>
                    <Input value={dimensoes.produto.gtin13 || '-'} readOnly />
                  </div>
                </Col>
                <Col span={6}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Código de Barras:</Text>
                    <BarcodeDisplay value={dimensoes.produto.gtin13 || ''} format="EAN13" />
                  </div>
                </Col>
              </Row>
            </Card>
          </>
        );

      case 'embalagem':
        return (
          <Card title="Dimensões da Caixa" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Altura:</Text>
                  <Input
                    value={formatNumber(dimensoes.caixa.embalagem.altura)}
                    readOnly
                    addonAfter="m"
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Largura:</Text>
                  <Input
                    value={formatNumber(dimensoes.caixa.embalagem.largura)}
                    readOnly
                    addonAfter="m"
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Profundidade:</Text>
                  <Input
                    value={formatNumber(dimensoes.caixa.embalagem.profundidade)}
                    readOnly
                    addonAfter="m"
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Peso:</Text>
                  <Input
                    value={formatNumber(dimensoes.caixa.embalagem.peso)}
                    readOnly
                    addonAfter="kg"
                    style={inputStyle}
                  />
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Produtos por Caixa:</Text>
                  <Input
                    value={formatNumber(dimensoes.caixa.produtos, 0)}
                    readOnly
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Sigla:</Text>
                  <Input
                    value={dimensoes.caixa.embalagem.sigla || '-'}
                    readOnly
                    style={inputStyle}
                  />
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>GTIN-14 (DUN):</Text>
                  <Input
                    value={dimensoes.caixa.gtin14 ? String(dimensoes.caixa.gtin14) : '-'}
                    readOnly
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Código de Barras:</Text>
                  <BarcodeDisplay
                    value={dimensoes.caixa.gtin14 ? String(dimensoes.caixa.gtin14) : ''}
                    format="ITF14"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        );

      case 'palete':
        return (
          <Card title="Dimensões do Palete" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Lastro:</Text>
                  <Input
                    value={formatNumber(dimensoes.palete.lastro, 0)}
                    readOnly
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Camadas:</Text>
                  <Input
                    value={formatNumber(dimensoes.palete.camadas, 0)}
                    readOnly
                    style={inputStyle}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Caixas por Palete:</Text>
                  <Input
                    value={formatNumber(dimensoes.palete.caixasPalete, 0)}
                    readOnly
                    style={inputStyle}
                  />
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card size="small" type="inner" title="Cálculo">
                  <Text>
                    Total de caixas: <strong>{formatNumber(dimensoes.palete.lastro, 0)}</strong>{' '}
                    (lastro) × <strong>{formatNumber(dimensoes.palete.camadas, 0)}</strong>{' '}
                    (camadas) = <strong>{formatNumber(dimensoes.palete.caixasPalete, 0)}</strong>{' '}
                    caixas
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>
        );

      default:
        return null;
    }
  };

  // Está carregando se: loading ativo OU (tem código mas não tem dados ainda)
  const isLoading = loading || (!!selectedItem?.itemCodigo && !dimensoes);

  return (
    <TabLayoutWrapper
      loading={isLoading}
      error={error}
      isEmpty={!selectedItem}
      emptyMessage="Selecione um item para ver suas dimensões"
      title={title}
      menuContent={dimensoes && menuVisible ? menuContent : undefined}
      menuWidth={220}
    >
      {renderConteudo()}
    </TabLayoutWrapper>
  );
};

export default Dimensoes;
