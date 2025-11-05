// src/modules/item/dadosCadastrais/informacoesGerais/components/Main.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Row, Col, Card, Menu, Button, Tooltip, Skeleton } from 'antd';
import {
  InfoCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  PictureOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { itemInformacoesGeraisService } from '../services/itemInformacoesGerais.service';
import { ItemInformacoesGeraisFlat } from '../types';
import TabLayoutWrapper from '../../../../../shared/components/TabLayoutWrapper';
import { useKeyboardShortcuts } from '../../../../../shared/hooks/useKeyboardShortcuts';
import { Empty, Spin } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface BaseTabProps {
  itemCodigo: string | null;
  preloadedData?: ItemInformacoesGeraisFlat | null;
  isItemChanging?: boolean;
}

// Componente para exibir imagens do produto
const ImagemProduto: React.FC<{ itemCodigo: string }> = ({ itemCodigo }) => {
  const [imagensDisponiveis, setImagensDisponiveis] = useState<number[]>([]);
  const [imagemAtual, setImagemAtual] = useState<number>(1);
  const [carregando, setCarregando] = useState(true);

  const BASE_URL = 'https://produtos.lorenzetti.com.br';
  const MAX_IMAGENS = 10;

  useEffect(() => {
    setCarregando(true);
    setImagensDisponiveis([]);
    setImagemAtual(1);

    const verificarImagens = async () => {
      const encontradas: number[] = [];

      for (let i = 1; i <= MAX_IMAGENS; i++) {
        const numeroFormatado = i.toString().padStart(3, '0');
        const url = `${BASE_URL}/${itemCodigo}_${numeroFormatado}.jpg`;

        try {
          const existe = await verificarImagemExiste(url);
          if (existe) {
            encontradas.push(i);
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      setImagensDisponiveis(encontradas);
      if (encontradas.length > 0) {
        setImagemAtual(encontradas[0]);
      }
      setCarregando(false);
    };

    verificarImagens();
  }, [itemCodigo]);

  const verificarImagemExiste = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(false), 5000);
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      img.src = url;
    });
  };

  const getUrlImagem = (numero: number) => {
    const numeroFormatado = numero.toString().padStart(3, '0');
    return `${BASE_URL}/${itemCodigo}_${numeroFormatado}.jpg`;
  };

  const proximaImagem = () => {
    const indexAtual = imagensDisponiveis.indexOf(imagemAtual);
    if (indexAtual < imagensDisponiveis.length - 1) {
      setImagemAtual(imagensDisponiveis[indexAtual + 1]);
    }
  };

  const imagemAnterior = () => {
    const indexAtual = imagensDisponiveis.indexOf(imagemAtual);
    if (indexAtual > 0) {
      setImagemAtual(imagensDisponiveis[indexAtual - 1]);
    }
  };

  if (carregando) {
    return (
      <Card title="Imagens do Produto" size="small">
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" tip="Verificando imagens disponíveis..." />
        </div>
      </Card>
    );
  }

  if (imagensDisponiveis.length === 0) {
    return (
      <Card title="Imagens do Produto" size="small">
        <Empty description="Nenhuma imagem disponível para este produto" />
      </Card>
    );
  }

  const indexAtual = imagensDisponiveis.indexOf(imagemAtual);

  return (
    <>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
            borderRadius: 4,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <img
            src={getUrlImagem(imagemAtual)}
            alt={`Produto ${itemCodigo} - Imagem ${imagemAtual}`}
            style={{
              maxWidth: '100%',
              maxHeight: 400,
              objectFit: 'contain',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Button icon={<LeftOutlined />} onClick={imagemAnterior} disabled={indexAtual === 0}>
            Anterior
          </Button>
          <Button
            icon={<RightOutlined />}
            onClick={proximaImagem}
            disabled={indexAtual === imagensDisponiveis.length - 1}
          >
            Próxima
          </Button>
        </div>
      </Card>

      {imagensDisponiveis.length > 1 && (
        <Card title="Miniaturas" size="small">
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {imagensDisponiveis.map((numero) => (
              <div
                key={numero}
                onClick={() => setImagemAtual(numero)}
                style={{
                  cursor: 'pointer',
                  border: imagemAtual === numero ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  padding: 4,
                  backgroundColor: imagemAtual === numero ? '#e6f7ff' : 'transparent',
                  transition: 'all 0.3s',
                }}
              >
                <img
                  src={getUrlImagem(numero)}
                  alt={`Thumbnail ${numero}`}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
};

const InformacoesGerais: React.FC<BaseTabProps> = ({
  itemCodigo,
  preloadedData,
  isItemChanging = false,
}) => {
  const [secaoAtiva, setSecaoAtiva] = useState('principais');
  const [itemData, setItemData] = useState<ItemInformacoesGeraisFlat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const lastLoadedCodeRef = useRef<string>('');

  // Mapeamento de índice para chave de seção
  const secaoKeys = ['principais', 'datas', 'localizacao', 'classificacoes', 'imagens'];

  // Atalhos de teclado
  useKeyboardShortcuts({
    onSubmenuShortcut: (index) => {
      if (index >= 1 && index <= 5) {
        const secaoKey = secaoKeys[index - 1];
        setSecaoAtiva(secaoKey);
      }
    },
    onToggleMenu: () => setMenuVisible((prev) => !prev),
    enabled: !!itemData,
  });

  // Limpar dados imediatamente quando itemCodigo muda (para mostrar skeleton)
  useEffect(() => {
    if (lastLoadedCodeRef.current && lastLoadedCodeRef.current !== itemCodigo) {
      setItemData(null);
    }
  }, [itemCodigo]);

  useEffect(() => {
    const fetchItemData = async () => {
      if (!itemCodigo) {
        setItemData(null);
        lastLoadedCodeRef.current = '';
        return;
      }

      // SE HOUVER DADOS PRÉ-CARREGADOS E CORRESPONDEM AO ITEM ATUAL, USA ELES
      // ✅ FIX: Backend retorna itemCodigo com espaços em branco, usar .trim()
      if (preloadedData && preloadedData.itemCodigo.trim() === itemCodigo) {
        setItemData(preloadedData);
        lastLoadedCodeRef.current = itemCodigo;
        setLoading(false);
        return;
      }

      // Se preloadedData existe mas é de OUTRO item, limpar itemData e esperar
      // Isso acontece quando está mudando de item e dados ainda não chegaram
      // ✅ FIX: Backend retorna itemCodigo com espaços em branco, usar .trim()
      if (preloadedData && preloadedData.itemCodigo.trim() !== itemCodigo) {
        setItemData(null);
        return;
      }

      // Se não tem preloadedData E já carregou este código antes, mantém dados
      if (lastLoadedCodeRef.current === itemCodigo && itemData) {
        return;
      }

      // Se não tem preloadedData E nunca carregou este código, esperar primeiro
      // Main.tsx deveria estar carregando. Se não carregar em 500ms, faz fallback
      if (!preloadedData && lastLoadedCodeRef.current !== itemCodigo) {
        setItemData(null);

        // Aguardar um pouco antes de fazer fallback fetch
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Se ainda não tem dados após esperar, fazer fallback fetch
        if (!preloadedData) {
          setLoading(true);
          setError(null);

          try {
            const data = await itemInformacoesGeraisService.getByCode(itemCodigo);
            setItemData(data);
            lastLoadedCodeRef.current = itemCodigo;
          } catch (err: any) {
            const errorMessage = err?.message || 'Erro ao carregar dados do item';
            setError(errorMessage);
            lastLoadedCodeRef.current = itemCodigo;
          } finally {
            setLoading(false);
          }
        }
      }
    };

    fetchItemData();
  }, [itemCodigo, preloadedData, itemData]);

  const menuItems = [
    {
      key: 'principais',
      label: (
        <span className="submenu-with-shortcut">
          Informações Principais
          <span className="submenu-shortcut-hint">Ctrl+Alt+1</span>
        </span>
      ),
      icon: <InfoCircleOutlined />,
    },
    {
      key: 'datas',
      label: (
        <span className="submenu-with-shortcut">
          Status e Datas
          <span className="submenu-shortcut-hint">Ctrl+Alt+2</span>
        </span>
      ),
      icon: <CalendarOutlined />,
    },
    {
      key: 'localizacao',
      label: (
        <span className="submenu-with-shortcut">
          Localização
          <span className="submenu-shortcut-hint">Ctrl+Alt+3</span>
        </span>
      ),
      icon: <EnvironmentOutlined />,
    },
    {
      key: 'classificacoes',
      label: (
        <span className="submenu-with-shortcut">
          Classificações
          <span className="submenu-shortcut-hint">Ctrl+Alt+4</span>
        </span>
      ),
      icon: <AppstoreOutlined />,
    },
    {
      key: 'imagens',
      label: (
        <span className="submenu-with-shortcut">
          Imagens
          <span className="submenu-shortcut-hint">Ctrl+Alt+5</span>
        </span>
      ),
      icon: <PictureOutlined />,
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

  // Mostra skeleton quando:
  // 1. Não tem dados (!itemData), OU
  // 2. Os dados existem mas são de outro item (itemData.itemCodigo !== itemCodigo)
  const shouldShowSkeleton = !itemData || itemData.itemCodigo !== itemCodigo;

  const title = shouldShowSkeleton ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Tooltip title={menuVisible ? 'Esconder menu (Ctrl+Alt+0)' : 'Mostrar menu (Ctrl+Alt+0)'}>
        <Button
          type="text"
          size="small"
          icon={menuVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setMenuVisible((prev) => !prev)}
        />
      </Tooltip>
      <Skeleton.Input active style={{ width: 400, height: 22 }} />
    </div>
  ) : (
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
        Item: {itemData.itemCodigo} - {itemData.itemDescricao}
      </Text>
    </div>
  );

  const fieldStyle = { marginBottom: 16 };
  const labelStyle = { fontWeight: 'bold' as const, marginBottom: 4, display: 'block' };

  const renderConteudo = () => {
    if (!itemData) {
      return null;
    }

    switch (secaoAtiva) {
      case 'principais':
        return (
          <Card title="Informações Principais" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Código:</Text>
                  <Input value={itemData.itemCodigo} readOnly />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Unidade de Medida:</Text>
                  <Input value={itemData.unidadeMedidaCodigo} readOnly />
                </div>
              </Col>
              <Col span={6}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Unidade Descrição:</Text>
                  <Input value={itemData.unidadeMedidaDescricao} readOnly />
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Descrição:</Text>
                  <Input value={itemData.itemDescricao} readOnly />
                </div>
              </Col>
            </Row>
            {itemData.itemDescricaoResumida && (
              <Row gutter={16}>
                <Col span={24}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Descrição Resumida:</Text>
                    <Input value={itemData.itemDescricaoResumida} readOnly />
                  </div>
                </Col>
              </Row>
            )}
            {itemData.itemDescricaoAlternativa && (
              <Row gutter={16}>
                <Col span={24}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Descrição Alternativa:</Text>
                    <Input value={itemData.itemDescricaoAlternativa} readOnly />
                  </div>
                </Col>
              </Row>
            )}
            {itemData.itemNarrativa && (
              <Row gutter={16}>
                <Col span={24}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Narrativa:</Text>
                    <Input.TextArea
                      value={itemData.itemNarrativa}
                      readOnly
                      autoSize={{ minRows: 3, maxRows: 10 }}
                    />
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        );

      case 'datas':
        return (
          <Card title="Status e Datas" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Status:</Text>
                  <Input value={itemData.itemStatus} readOnly />
                </div>
              </Col>
              <Col span={8}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Data Obsolescência:</Text>
                  <Input value={itemData.dataObsolescencia || 'N/A'} readOnly />
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Data Implantação:</Text>
                  <Input value={itemData.dataImplantacao} readOnly />
                </div>
              </Col>
              <Col span={8}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Data Liberação:</Text>
                  <Input value={itemData.dataLiberacao} readOnly />
                </div>
              </Col>
            </Row>
          </Card>
        );

      case 'localizacao':
        return (
          <Card title="Localização e Armazenamento" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Estabelecimento Padrão:</Text>
                  <Input value={itemData.estabelecimentoPadraoCodigo} readOnly />
                </div>
              </Col>
              <Col span={8}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Endereço:</Text>
                  <Input value={itemData.endereco || '-'} readOnly />
                </div>
              </Col>
            </Row>

            {(itemData.deposito || itemData.codLocalizacao) && (
              <Row gutter={16}>
                <Col span={8}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Depósito Padrão:</Text>
                    <Input value={itemData.deposito || '-'} readOnly />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Localização Padrão:</Text>
                    <Input value={itemData.codLocalizacao || '-'} readOnly />
                  </div>
                </Col>
              </Row>
            )}

            {(itemData.contenedorCodigo || itemData.contenedorDescricao) && (
              <Row gutter={16}>
                <Col span={8}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Contenedor Código:</Text>
                    <Input value={itemData.contenedorCodigo || '-'} readOnly />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={fieldStyle}>
                    <Text style={labelStyle}>Contenedor Descrição:</Text>
                    <Input value={itemData.contenedorDescricao || '-'} readOnly />
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        );

      case 'classificacoes':
        return (
          <Card title="Classificações" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Família:</Text>
                  <Input value={itemData.familiaCodigo} readOnly />
                </div>
              </Col>
              <Col span={12}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Família Descrição:</Text>
                  <Input value={itemData.familiaDescricao} readOnly />
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Família Comercial:</Text>
                  <Input value={itemData.familiaComercialCodigo} readOnly />
                </div>
              </Col>
              <Col span={12}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Fam. Comercial Descrição:</Text>
                  <Input value={itemData.familiaComercialDescricao} readOnly />
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Grupo de Estoque:</Text>
                  <Input value={itemData.grupoEstoqueCodigo} readOnly />
                </div>
              </Col>
              <Col span={12}>
                <div style={fieldStyle}>
                  <Text style={labelStyle}>Grupo Descrição:</Text>
                  <Input value={itemData.grupoEstoqueDescricao} readOnly />
                </div>
              </Col>
            </Row>
          </Card>
        );

      case 'imagens':
        return <ImagemProduto itemCodigo={itemData.itemCodigo} />;

      default:
        return null;
    }
  };

  // Está carregando se: loading ativo OU (tem código mas não tem dados ainda)
  const isLoading = loading || (!!itemCodigo && !itemData);

  return (
    <TabLayoutWrapper
      loading={isLoading}
      error={error}
      isEmpty={!itemCodigo}
      emptyMessage="Selecione um item para ver suas informações"
      title={title}
      menuContent={itemData && menuVisible ? menuContent : undefined}
      menuWidth={220}
    >
      {renderConteudo()}
    </TabLayoutWrapper>
  );
};

export default InformacoesGerais;
