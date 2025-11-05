import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  ConfigProvider,
  Layout,
  Typography,
  Space,
  Switch,
  Card,
  Button,
  Tooltip,
  Spin,
} from 'antd';
import {
  BulbOutlined,
  BulbFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ptBR from 'antd/locale/pt_BR';
import './shared/styles/design-tokens.css';
import './shared/styles/global.css';
import { getTheme } from './shared/styles/theme.config';
import MenuLateral from './layouts/MenuLateral';
import SearchForm from './modules/item/search/components/SearchForm';
import HelpModal from './shared/components/HelpModal';
import SearchResultsDock from './shared/components/SearchResultsDock';
import RateLimitWarningContainer from './shared/components/RateLimitWarningContainer';
import RateLimitBadge from './shared/components/RateLimitBadge';
import { useKeyboardShortcuts } from './shared/hooks/useKeyboardShortcuts';
import { useSearchFilters } from './shared/hooks/useSearchFilters';
import { useCombos } from './shared/hooks/useCombos';
import { useTableNavigation } from './shared/hooks/useTableNavigation';
import { useEnterKeyListener } from './shared/hooks/useEnterKeyListener';
import { useHelpContext } from './shared/hooks/useHelpContext';
import { useRouteNavigation } from './shared/hooks/useRouteNavigation';
import { useTheme } from './shared/contexts/ThemeContext';
import type { HelpContext } from './shared/types/help.types';
import type { BreadcrumbItem } from './modules/engenharia/estrutura/components/Breadcrumb';
import type { ItemSearchResultItem } from './modules/item/search/types/search.types';
import { env } from './shared/utils/env';

/**
 * Lazy loading dos módulos principais
 * Melhora performance inicial carregando apenas quando necessário
 */
const DadosCadastraisMain = lazy(() => import('./modules/item/dadosCadastrais/components/Main'));
const EngenhariaMain = lazy(() => import('./modules/engenharia/estrutura/components/Main'));
const PCPMain = lazy(() => import('./modules/pcp/components/Main'));
const ManufaturaMain = lazy(() => import('./modules/manufatura/components/Main'));
const SuprimentosMain = lazy(() => import('./modules/suprimentos/components/Main'));
const FiscalMain = lazy(() => import('./modules/fiscal/components/Main'));

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    selectedMenuKey,
    codigo: _codigo,
    activeTabKey,
    navigateToModule,
    navigateToTab,
    navigateToItem,
    navigateToSearch,
  } = useRouteNavigation();
  const [menuLateralVisible, setMenuLateralVisible] = useState(true);
  const [activeVisualizacao, setActiveVisualizacao] = useState('tabela');

  // Aplicar cor de fundo no body baseado no tema
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#000c17' : '#f0f2f5';
  }, [theme]);

  // Estados do sistema de ajuda
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [helpInitialContext, setHelpInitialContext] = useState<HelpContext | undefined>();
  const [helpInitialTopicKey, setHelpInitialTopicKey] = useState<string | undefined>();

  // Custom hooks para gerenciamento de estado
  const {
    filtros,
    searchResults,
    loading,
    selectedRowKey,
    handleFilterChange,
    handleSearch,
    handleClear,
    handleRowClick: handleRowClickFromFilters,
  } = useSearchFilters({
    navigateToItem,
    navigateToSearch,
    currentModule: selectedMenuKey, // Pass current module for smart navigation
  });

  const { familias, familiasComerciais, gruposDeEstoque, loadingCombos } = useCombos();

  // Sincronizar selectedRowKey com código da URL
  // ⚠️ IMPORTANTE: Apenas sincroniza quando NÃO estiver na aba 'resultado'
  // Na aba resultado, a navegação por teclado deve alterar selectedRowKey livremente
  // sem forçar sincronização com a URL (que permanece com o código anterior)
  useEffect(() => {
    // Se estamos na aba resultado, não sincronizar
    // (permite navegação livre por teclado sem interferência da URL)
    if (activeTabKey === 'resultado') {
      return;
    }

    if (_codigo && _codigo !== selectedRowKey) {
      // URL mudou mas selectedRowKey do state não acompanhou
      // Criar um registro para atualizar o state
      const itemFromResults = searchResults.find((i) => i.itemCodigo === _codigo);

      if (itemFromResults) {
        // Item existe nos resultados de busca - usar dados completos
        handleRowClickFromFilters(itemFromResults);
      } else {
        // Item não está nos resultados (caso drill-down) - criar registro mínimo
        const fakeRecord: ItemSearchResultItem = {
          itemCodigo: _codigo,
          itemDescricao: '',
          unidadeMedidaCodigo: '',
          unidadeMedidaDescricao: '',
          familiaCodigo: '',
          familiaDescricao: '',
          familiaComercialCodigo: '',
          familiaComercialDescricao: '',
          grupoEstoqueCodigo: '',
          grupoEstoqueDescricao: '',
          codObsoleto: 0,
          gtin: '',
        };
        handleRowClickFromFilters(fakeRecord);
      }
    }
  }, [_codigo, selectedRowKey, searchResults, handleRowClickFromFilters, activeTabKey]);

  /**
   * Handler de clique em item da tabela
   * Clique simples apenas seleciona o item (destaca a linha)
   */
  const handleRowClick = (item: any) => {
    // Apenas chama handler do useSearchFilters para atualizar estado
    // NÃO navega para a URL (isso será feito apenas com Enter)
    handleRowClickFromFilters(item);
  };

  const { handleKeyDown } = useTableNavigation({
    searchResults,
    selectedRowKey,
    activeTabKey,
    onRowClick: handleRowClick,
    onEnterKey: () => {
      // Quando Enter for pressionado na aba Resultado, navegar para aba Base
      if (activeTabKey === 'resultado' && selectedRowKey) {
        // ✅ FIX: Usar navigateToItem com selectedRowKey ao invés de navigateToTab
        // porque na aba "resultado" o codigo na URL é null
        navigateToItem(selectedRowKey, 'base');
      }
    },
  });

  useEnterKeyListener({ onEnter: handleSearch, loading });

  // Contexto atual para ajuda contextual
  const currentHelpContext = useHelpContext({
    menuKey: selectedMenuKey,
    activeTabKey: activeTabKey,
  });

  // Handlers do sistema de ajuda
  const handleOpenContextualHelp = () => {
    setHelpInitialContext(currentHelpContext);
    setHelpInitialTopicKey(undefined);
    setHelpModalVisible(true);
  };

  const handleCloseHelp = () => {
    setHelpModalVisible(false);
    setHelpInitialContext(undefined);
    setHelpInitialTopicKey(undefined);
  };

  // Handler para seleção de menu (intercepta "Ajuda")
  const handleMenuSelect = (menuKey: string) => {
    if (menuKey === '0') {
      // Abre ajuda contextual ao invés de mudar o menu
      handleOpenContextualHelp();
    } else {
      // Navega para o módulo usando React Router
      navigateToModule(menuKey);
    }
  };

  // Estado para controlar menu secundário (visualizações em Engenharias)
  const [menuSecundarioVisible, setMenuSecundarioVisible] = useState(true);

  // Estados para controlar visibilidade do formulário de busca e header do item
  const [searchFormVisible, setSearchFormVisible] = useState(true);
  const [itemHeaderVisible, setItemHeaderVisible] = useState(true);

  // Estado do breadcrumb (preservado entre trocas de menu)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);

  // Resetar breadcrumb quando uma nova pesquisa é feita
  useEffect(() => {
    // Limpar breadcrumb ao limpar a pesquisa
    if (searchResults.length === 0) {
      setBreadcrumb([]);
    }
  }, [searchResults.length]);

  // Atalhos de teclado
  useKeyboardShortcuts({
    onMenuShortcut: handleMenuSelect,
    onTabShortcut: (tabIndex) => {
      if (selectedMenuKey === '1' && searchResults.length > 0) {
        const tabKeys = [
          'resultado',
          'base',
          'dimensoes',
          'planejamento',
          'manufatura',
          'fiscal',
          'suprimentos',
        ];
        const tabKey = tabKeys[tabIndex - 1];
        if (tabKey) {
          navigateToTab(tabKey);
        }
      } else if (selectedMenuKey === '2' && searchResults.length > 0) {
        const tabKeys = ['resultado', 'estrutura', 'ondeUsado'];
        const tabKey = tabKeys[tabIndex - 1];
        if (tabKey) {
          navigateToTab(tabKey);
        }
      } else if (selectedMenuKey === '3' && searchResults.length > 0) {
        const tabKeys = ['resultado', 'base'];
        const tabKey = tabKeys[tabIndex - 1];
        if (tabKey) {
          navigateToTab(tabKey);
        }
      } else if (selectedMenuKey === '4' && searchResults.length > 0) {
        const tabKeys = ['resultado', 'base'];
        const tabKey = tabKeys[tabIndex - 1];
        if (tabKey) {
          navigateToTab(tabKey);
        }
      } else if (selectedMenuKey === '5' && searchResults.length > 0) {
        const tabKeys = [
          'resultado',
          'base',
          'estoque',
          'movimento',
          'fornecedores',
          'programacao-entrega',
        ];
        const tabKey = tabKeys[tabIndex - 1];
        if (tabKey) {
          navigateToTab(tabKey);
        }
      } else if (selectedMenuKey === '6' && searchResults.length > 0) {
        const tabKeys = ['resultado', 'base'];
        const tabKey = tabKeys[tabIndex - 1];
        if (tabKey) {
          navigateToTab(tabKey);
        }
      }
    },
    onVisualizacaoShortcut: (vizIndex) => {
      if (
        selectedMenuKey === '2' &&
        (activeTabKey === 'estrutura' || activeTabKey === 'ondeUsado')
      ) {
        const vizKeys = ['tabela', 'sankey', 'arvore', 'treemap', 'grafo'];
        const vizKey = vizKeys[vizIndex - 1];
        if (vizKey) {
          setActiveVisualizacao(vizKey);
        }
      }
    },
    onToggleMainMenu: () => setMenuLateralVisible((prev) => !prev), // Ctrl+0 toggle menu principal
    onToggleMenu: () => setMenuSecundarioVisible((prev) => !prev), // Ctrl+Alt+0 toggle menu secundário
    onToggleSearchForm: () => setSearchFormVisible((prev) => !prev), // Ctrl+Shift+P toggle formulário de pesquisa
    onToggleItemHeader: () => setItemHeaderVisible((prev) => !prev), // Ctrl+Shift+H toggle header do item
    onF1Help: handleOpenContextualHelp,
    enabled: true,
  });

  // Estilos memoizados
  const headerLogoStyle: React.CSSProperties = useMemo(
    () => ({
      width: '250px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      background: theme === 'dark' ? '#001529' : '#1890ff',
      borderRight: '1px solid rgba(255, 255, 255, 0.2)',
    }),
    [theme]
  );

  const logoImageStyle: React.CSSProperties = useMemo(
    () => ({
      maxWidth: '100%',
      maxHeight: '48px',
      objectFit: 'contain',
    }),
    []
  );

  return (
    <ConfigProvider locale={ptBR} theme={getTheme(theme)}>
      {/* Rate Limit Warning - Fixo no topo */}
      <RateLimitWarningContainer />

      <Layout style={{ height: '100vh' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            background: theme === 'dark' ? '#001529' : '#1890ff',
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            width: '100%',
          }}
        >
          <div style={headerLogoStyle}>
            <img src="/images/lorenzetti-red.png" alt="Lorenzetti" style={logoImageStyle} />
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Botão toggle do menu principal */}
              <Tooltip
                title={menuLateralVisible ? 'Esconder menu (Ctrl+0)' : 'Mostrar menu (Ctrl+0)'}
              >
                <Button
                  type="text"
                  icon={menuLateralVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                  onClick={() => setMenuLateralVisible((prev) => !prev)}
                  style={{
                    color: '#fff',
                    fontSize: 18,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Tooltip>

              {/* Botão toggle do formulário de pesquisa */}
              <Tooltip
                title={
                  searchFormVisible
                    ? 'Esconder pesquisa (Ctrl+Shift+P)'
                    : 'Mostrar pesquisa (Ctrl+Shift+P)'
                }
              >
                <Button
                  type="text"
                  icon={searchFormVisible ? <SearchOutlined /> : <EyeInvisibleOutlined />}
                  onClick={() => setSearchFormVisible((prev) => !prev)}
                  aria-label={searchFormVisible ? 'Esconder pesquisa' : 'Mostrar pesquisa'}
                  style={{
                    color: '#fff',
                    fontSize: 18,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Tooltip>

              {/* Botão toggle do header do item */}
              <Tooltip
                title={
                  itemHeaderVisible
                    ? 'Esconder header do item (Ctrl+Shift+H)'
                    : 'Mostrar header do item (Ctrl+Shift+H)'
                }
              >
                <Button
                  type="text"
                  icon={itemHeaderVisible ? <FileTextOutlined /> : <EyeInvisibleOutlined />}
                  onClick={() => setItemHeaderVisible((prev) => !prev)}
                  aria-label={
                    itemHeaderVisible ? 'Esconder header do item' : 'Mostrar header do item'
                  }
                  style={{
                    color: '#fff',
                    fontSize: 18,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Tooltip>

              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                {env.APP_NAME} v{env.VERSION}
              </Title>
            </div>
            <Space size="large">
              <RateLimitBadge />
              <Space>
                <BulbOutlined style={{ color: theme === 'dark' ? '#ffd666' : '#fff' }} />
                <Switch
                  checkedChildren="Escuro"
                  unCheckedChildren="Claro"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
                <BulbFilled style={{ color: theme === 'dark' ? '#ffd666' : '#fff' }} />
              </Space>
            </Space>
          </div>
        </Header>

        <Layout style={{ background: theme === 'dark' ? '#000c17' : '#f0f2f5', marginTop: 64 }}>
          {/* Sider condicional */}
          {menuLateralVisible && (
            <Sider
              width={250}
              style={{
                background: theme === 'dark' ? '#001529' : '#fff',
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                top: 64,
                left: 0,
                zIndex: 1,
              }}
            >
              <MenuLateral
                selectedKey={selectedMenuKey}
                onSelect={handleMenuSelect}
                theme={theme}
              />
            </Sider>
          )}

          <Layout
            style={{
              padding: '0 24px 24px 24px',
              background: 'transparent',
              marginLeft: menuLateralVisible ? 250 : 0,
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 64px)',
              overflow: 'hidden',
            }}
          >
            <Content
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                flex: 1,
                overflow: 'hidden',
                gap: 24,
              }}
            >
              {searchFormVisible && (
                <Card title="" loading={loadingCombos}>
                  <SearchForm
                    filters={filtros}
                    familias={familias}
                    familiasComerciais={familiasComerciais}
                    gruposDeEstoque={gruposDeEstoque}
                    loading={loading}
                    onChange={handleFilterChange}
                    onSearch={handleSearch}
                    onClear={handleClear}
                  />
                </Card>
              )}

              <Card
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
                styles={{
                  body: {
                    padding: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  },
                }}
              >
                {selectedMenuKey === '1' && (
                  <>
                    {searchResults.length > 0 || loading ? (
                      <Suspense
                        fallback={
                          <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Carregando módulo..." />
                          </div>
                        }
                      >
                        <DadosCadastraisMain
                          items={searchResults}
                          loading={loading}
                          selectedRowKey={selectedRowKey}
                          onRowClick={handleRowClick}
                          activeTabKey={activeTabKey}
                          onTabChange={navigateToTab}
                          onKeyDown={handleKeyDown}
                          itemHeaderVisible={itemHeaderVisible}
                        />
                      </Suspense>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                        Utilize os filtros acima para pesquisar itens
                      </p>
                    )}
                  </>
                )}

                {selectedMenuKey === '2' && (
                  <>
                    {searchResults.length > 0 || loading ? (
                      <Suspense
                        fallback={
                          <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Carregando módulo..." />
                          </div>
                        }
                      >
                        <EngenhariaMain
                          items={searchResults}
                          loading={loading}
                          selectedRowKey={selectedRowKey}
                          onRowClick={handleRowClick}
                          activeTabKey={activeTabKey}
                          onTabChange={navigateToTab}
                          onKeyDown={handleKeyDown}
                          activeVisualizacao={activeVisualizacao}
                          onVisualizacaoChange={setActiveVisualizacao}
                          menuSecundarioVisible={menuSecundarioVisible}
                          onToggleMenuSecundario={() => setMenuSecundarioVisible((prev) => !prev)}
                          breadcrumb={breadcrumb}
                          onBreadcrumbChange={setBreadcrumb}
                          itemHeaderVisible={itemHeaderVisible}
                        />
                      </Suspense>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                        Utilize os filtros acima para pesquisar itens
                      </p>
                    )}
                  </>
                )}

                {selectedMenuKey === '3' && (
                  <>
                    {searchResults.length > 0 || loading ? (
                      <Suspense
                        fallback={
                          <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Carregando módulo..." />
                          </div>
                        }
                      >
                        <PCPMain
                          items={searchResults}
                          loading={loading}
                          selectedRowKey={selectedRowKey}
                          onRowClick={handleRowClick}
                          activeTabKey={activeTabKey}
                          onTabChange={navigateToTab}
                          onKeyDown={handleKeyDown}
                          itemHeaderVisible={itemHeaderVisible}
                        />
                      </Suspense>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                        Utilize os filtros acima para pesquisar itens
                      </p>
                    )}
                  </>
                )}

                {selectedMenuKey === '4' && (
                  <>
                    {searchResults.length > 0 || loading ? (
                      <Suspense
                        fallback={
                          <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Carregando módulo..." />
                          </div>
                        }
                      >
                        <ManufaturaMain
                          items={searchResults}
                          loading={loading}
                          selectedRowKey={selectedRowKey}
                          onRowClick={handleRowClick}
                          activeTabKey={activeTabKey}
                          onTabChange={navigateToTab}
                          onKeyDown={handleKeyDown}
                          itemHeaderVisible={itemHeaderVisible}
                        />
                      </Suspense>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                        Utilize os filtros acima para pesquisar itens
                      </p>
                    )}
                  </>
                )}

                {selectedMenuKey === '5' && (
                  <>
                    {searchResults.length > 0 || loading ? (
                      <Suspense
                        fallback={
                          <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Carregando módulo..." />
                          </div>
                        }
                      >
                        <SuprimentosMain
                          items={searchResults}
                          loading={loading}
                          selectedRowKey={selectedRowKey}
                          onRowClick={handleRowClick}
                          activeTabKey={activeTabKey}
                          onTabChange={navigateToTab}
                          onKeyDown={handleKeyDown}
                          itemHeaderVisible={itemHeaderVisible}
                        />
                      </Suspense>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                        Utilize os filtros acima para pesquisar itens
                      </p>
                    )}
                  </>
                )}

                {selectedMenuKey === '6' && (
                  <>
                    {searchResults.length > 0 || loading ? (
                      <Suspense
                        fallback={
                          <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Carregando módulo..." />
                          </div>
                        }
                      >
                        <FiscalMain
                          items={searchResults}
                          loading={loading}
                          selectedRowKey={selectedRowKey}
                          onRowClick={handleRowClick}
                          activeTabKey={activeTabKey}
                          onTabChange={navigateToTab}
                          onKeyDown={handleKeyDown}
                          itemHeaderVisible={itemHeaderVisible}
                        />
                      </Suspense>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                        Utilize os filtros acima para pesquisar itens
                      </p>
                    )}
                  </>
                )}

                {selectedMenuKey !== '1' &&
                  selectedMenuKey !== '2' &&
                  selectedMenuKey !== '3' &&
                  selectedMenuKey !== '4' &&
                  selectedMenuKey !== '5' &&
                  selectedMenuKey !== '6' && (
                    <div style={{ padding: 24 }}>
                      <Title level={4}>Módulo em Desenvolvimento</Title>
                      <p>Menu selecionado: {selectedMenuKey}</p>
                      <p style={{ color: '#999', marginTop: 20 }}>
                        A mesma área de pesquisa serve para este módulo. As abas e resultados
                        específicos serão implementados futuramente.
                      </p>
                    </div>
                  )}
              </Card>
            </Content>
          </Layout>
        </Layout>
      </Layout>

      {/* Modal de Ajuda */}
      <HelpModal
        visible={helpModalVisible}
        onClose={handleCloseHelp}
        initialContext={helpInitialContext}
        initialTopicKey={helpInitialTopicKey}
      />

      {/* Dock de resultados - fixo na parte inferior */}
      <SearchResultsDock
        items={searchResults}
        selectedKey={selectedRowKey}
        onItemClick={(itemCode) => {
          const item = searchResults.find((i) => i.itemCodigo === itemCode);
          if (item) {
            if (env.IS_DEV) {
              // eslint-disable-next-line no-console
              console.log('🎯 Dock click:', itemCode, 'Item encontrado:', item);
            }
            handleRowClick(item);
          }
        }}
        visible={searchResults.length > 1 && activeTabKey !== 'resultado'}
      />
    </ConfigProvider>
  );
}

export default App;
