import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Mapeia selectedMenuKey para path base
 */
const menuKeyToPath: Record<string, string> = {
  '1': '/dados-mestres',
  '2': '/engenharias',
  '3': '/pcp',
  '4': '/manufatura',
  '5': '/suprimentos',
  '6': '/fiscal',
};

/**
 * Abas padrão por módulo
 */
const defaultTabByModule: Record<string, string> = {
  '1': 'base', // Dados Mestres
  '2': 'estrutura', // Engenharias
  '3': 'base', // PCP
  '4': 'base', // Manufatura
  '5': 'base', // Suprimentos
  '6': 'base', // Fiscal
};

/**
 * Hook para navegação baseada em rotas (React Router)
 *
 * Substitui a navegação baseada em state (selectedMenuKey, activeTabKey)
 * por navegação baseada em URLs.
 *
 * @returns {object} Objeto com informações da rota atual e funções de navegação
 *
 * @example
 * ```tsx
 * const { selectedMenuKey, codigo, activeTabKey, navigateToModule, navigateToTab } = useRouteNavigation();
 *
 * // Navegar para módulo Dados Mestres
 * navigateToModule('1');
 *
 * // Navegar para aba fiscal do item atual
 * navigateToTab('fiscal');
 * ```
 */
export const useRouteNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ codigo?: string; aba?: string }>();

  /**
   * Determina o módulo atual baseado no path
   */
  const selectedMenuKey = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith('/dados-mestres')) {
      return '1';
    }
    if (path.startsWith('/engenharias')) {
      return '2';
    }
    if (path.startsWith('/pcp')) {
      return '3';
    }
    if (path.startsWith('/manufatura')) {
      return '4';
    }
    if (path.startsWith('/suprimentos')) {
      return '5';
    }
    if (path.startsWith('/fiscal')) {
      return '6';
    }

    return '1'; // Default: Dados Mestres
  }, [location.pathname]);

  /**
   * Código do item selecionado (da URL)
   */
  const codigo = params.codigo || null;

  /**
   * Aba ativa (da URL ou padrão do módulo)
   */
  const activeTabKey = useMemo(() => {
    if (params.aba) {
      return params.aba;
    }

    // Se não tem aba na URL, retorna aba padrão se tem código
    if (codigo) {
      return defaultTabByModule[selectedMenuKey] || 'base';
    }

    // Se não tem código, retorna 'resultado' (tela de busca)
    return 'resultado';
  }, [params.aba, codigo, selectedMenuKey]);

  /**
   * Navega para um módulo específico
   * @param menuKey - '1' para Dados Mestres, '2' para Engenharias, '5' para Suprimentos
   *
   * ✨ SMART NAVIGATION: Se já existe um item selecionado, navega diretamente
   * para a aba de dados padrão do módulo (não para "Resultado")
   */
  const navigateToModule = useCallback(
    (menuKey: string) => {
      const targetPath = menuKeyToPath[menuKey];

      if (targetPath) {
        // ✅ Se tem item selecionado, navega direto para aba de dados
        if (codigo) {
          const targetTab = defaultTabByModule[menuKey] || 'base';
          navigate(`${targetPath}/${codigo}/${targetTab}`);
        } else {
          // Sem item selecionado, vai para tela de busca
          navigate(targetPath);
        }
      }
    },
    [navigate, codigo]
  );

  /**
   * Navega para uma aba específica (mantém o item atual se existir)
   * @param tabKey - Nome da aba (ex: 'base', 'fiscal', 'estrutura', 'resultado')
   */
  const navigateToTab = useCallback(
    (tabKey: string) => {
      const basePath = menuKeyToPath[selectedMenuKey];

      if (codigo) {
        // ✅ Se tem código selecionado, navega para aba específica (qualquer aba, inclusive "resultado")
        navigate(`${basePath}/${codigo}/${tabKey}`);
      } else {
        // Sem código selecionado, volta para tela de busca
        navigate(basePath);
      }
    },
    [navigate, selectedMenuKey, codigo]
  );

  /**
   * Navega para um item específico (com aba padrão ou especificada)
   * @param itemCodigo - Código do item
   * @param tabKey - Aba específica (opcional, usa padrão se não fornecida)
   */
  const navigateToItem = useCallback(
    (itemCodigo: string, tabKey?: string) => {
      const basePath = menuKeyToPath[selectedMenuKey];
      const targetTab = tabKey || defaultTabByModule[selectedMenuKey] || 'base';
      navigate(`${basePath}/${itemCodigo}/${targetTab}`);
    },
    [navigate, selectedMenuKey]
  );

  /**
   * Volta para a tela de busca (sem item selecionado)
   */
  const navigateToSearch = useCallback(() => {
    const basePath = menuKeyToPath[selectedMenuKey];
    navigate(basePath);
  }, [navigate, selectedMenuKey]);

  return {
    selectedMenuKey,
    codigo,
    activeTabKey,
    navigateToModule,
    navigateToTab,
    navigateToItem,
    navigateToSearch,
    location,
  };
};
