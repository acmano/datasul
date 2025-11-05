/**
 * 🎨 THEME CONFIGURATION
 * Configuração customizada do tema Ant Design
 * Integra os design tokens com o sistema de tema do Ant Design
 */

import { ThemeConfig } from 'antd';

/**
 * Tema customizado para Light Mode
 */
export const lightTheme: ThemeConfig = {
  token: {
    // ========== CORES ==========
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // Texto
    colorText: 'rgba(0, 0, 0, 0.85)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

    // Background
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorBgSpotlight: '#fafafa',

    // Bordas
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // ========== TIPOGRAFIA ==========
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,

    // ========== LAYOUT ==========
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // ========== ESPAÇAMENTO ==========
    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingLG: 24,
    paddingXL: 32,

    margin: 16,
    marginXS: 8,
    marginSM: 12,
    marginLG: 24,
    marginXL: 32,

    // ========== SOMBRAS ==========
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05)',

    // ========== TRANSIÇÕES ==========
    motionDurationFast: '0.15s',
    motionDurationMid: '0.25s',
    motionDurationSlow: '0.35s',

    // ========== CONTROLE DE ALTURA ==========
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,

    // ========== LINE HEIGHT ==========
    lineHeight: 1.5,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.2,
  },

  components: {
    // ========== BUTTON ==========
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 500,
      borderRadius: 6,
      paddingContentHorizontal: 20,
      primaryShadow: '0 4px 12px rgba(24, 144, 255, 0.2)',
    },

    // ========== INPUT ==========
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 6,
      paddingBlock: 8,
      paddingInline: 12,
    },

    // ========== SELECT ==========
    Select: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 6,
    },

    // ========== CARD ==========
    Card: {
      borderRadiusLG: 8,
      paddingLG: 24,
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
    },

    // ========== TABLE ==========
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0, 0, 0, 0.85)',
      borderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      headerSplitColor: '#f0f0f0',
    },

    // ========== TABS ==========
    Tabs: {
      itemActiveColor: '#1890ff',
      itemHoverColor: '#40a9ff',
      itemSelectedColor: '#1890ff',
      inkBarColor: '#1890ff',
      cardBg: '#fafafa',
    },

    // ========== MODAL ==========
    Modal: {
      borderRadiusLG: 8,
      contentBg: '#ffffff',
      headerBg: '#ffffff',
    },
  },
};

/**
 * Tema customizado para Dark Mode
 */
export const darkTheme: ThemeConfig = {
  token: {
    // ========== CORES ==========
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // Texto (Invertido)
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

    // Background (Dark)
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#000c17',
    colorBgSpotlight: '#434343',

    // Bordas (Dark)
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',

    // ========== MESMO RESTO DO LIGHT ==========
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,

    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingLG: 24,
    paddingXL: 32,

    margin: 16,
    marginXS: 8,
    marginSM: 12,
    marginLG: 24,
    marginXL: 32,

    // Sombras mais intensas no dark
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45), 0 1px 4px rgba(0, 0, 0, 0.25)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.35)',

    motionDurationFast: '0.15s',
    motionDurationMid: '0.25s',
    motionDurationSlow: '0.35s',

    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,

    lineHeight: 1.5,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.2,
  },

  // Mesmos components do light theme
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 500,
      borderRadius: 6,
      paddingContentHorizontal: 20,
      primaryShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
    },

    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 6,
      paddingBlock: 8,
      paddingInline: 12,
    },

    Select: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 6,
    },

    Card: {
      borderRadiusLG: 8,
      paddingLG: 24,
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.45)',
    },

    Table: {
      headerBg: '#1f1f1f',
      headerColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      headerSplitColor: '#303030',
    },

    Tabs: {
      itemActiveColor: '#1890ff',
      itemHoverColor: '#40a9ff',
      itemSelectedColor: '#1890ff',
      inkBarColor: '#1890ff',
      cardBg: '#1f1f1f',
    },

    Modal: {
      borderRadiusLG: 8,
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
    },
  },
};

/**
 * Helper para obter tema baseado no modo
 */
export const getTheme = (mode: 'light' | 'dark'): ThemeConfig => {
  return mode === 'light' ? lightTheme : darkTheme;
};
