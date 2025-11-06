// src/modules/engenharia/estrutura/components/ControlPanel.tsx

import React, { useState, useEffect } from 'react';
import { Radio, InputNumber, DatePicker, Checkbox, Slider, Button, Input } from 'antd';
import { SettingOutlined, DownOutlined, UpOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';
import { TipoEstrutura, ModoApresentacao } from '../types/estrutura.types';

// Estilo para forçar altura do campo de busca
const searchInputStyle = `
  .search-input-fixed {
    width: 200px !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    display: inline-flex !important;
    align-items: center !important;
  }

  .search-input-fixed .ant-input {
    height: 32px !important;
    line-height: 32px !important;
    flex: 1 !important;
    width: 100% !important;
    padding: 0 !important;
    border: none !important;
  }

  .search-input-fixed .ant-input:focus,
  .search-input-fixed .ant-input-affix-wrapper:focus,
  .search-input-fixed .ant-input-affix-wrapper-focused {
    outline: none !important;
  }
`;

interface ControlPanelProps {
  // Breadcrumb
  breadcrumb: BreadcrumbItem[];
  onBreadcrumbNavigate: (codigo: string, index: number) => void;

  // Controles de Visualização
  tipoEstrutura: TipoEstrutura;
  onTipoEstruturaChange: (tipo: TipoEstrutura) => void;
  quantidadeMultiplicador: number;
  onQuantidadeMultiplicadorChange: (quantidade: number) => void;
  modoApresentacao: ModoApresentacao;
  onModoApresentacaoChange: (modo: ModoApresentacao) => void;

  // Controles de Filtros
  dataReferencia: string;
  onDataReferenciaChange: (date: string) => void;
  mostrarHistorico: boolean;
  onMostrarHistoricoChange: (checked: boolean) => void;

  // Controles de Exibição
  showQty: boolean;
  onShowQtyChange: (checked: boolean) => void;
  baseHex: string;
  onBaseHexChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  maxLevel: number;
  currentLevel: number;
  onLevelChange: (level: number) => void;

  // Busca/Filtro
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;

  // Estado
  theme: 'light' | 'dark';
  isLoading?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  breadcrumb,
  onBreadcrumbNavigate,
  tipoEstrutura,
  onTipoEstruturaChange,
  quantidadeMultiplicador,
  onQuantidadeMultiplicadorChange,
  modoApresentacao,
  onModoApresentacaoChange,
  dataReferencia,
  onDataReferenciaChange,
  mostrarHistorico,
  onMostrarHistoricoChange,
  showQty,
  onShowQtyChange,
  baseHex,
  onBaseHexChange,
  bgColor,
  onBgColorChange,
  maxLevel,
  currentLevel,
  onLevelChange,
  searchTerm = '',
  onSearchTermChange,
  theme,
  isLoading = false,
}) => {
  // Estado do painel (persistido no localStorage)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('controlPanelExpanded');
    return saved === 'true';
  });

  // Persiste estado no localStorage
  useEffect(() => {
    localStorage.setItem('controlPanelExpanded', String(isExpanded));
  }, [isExpanded]);

  // Injeta CSS para forçar altura do campo de busca
  useEffect(() => {
    const styleId = 'search-input-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = searchInputStyle;
      document.head.appendChild(style);
    }
  }, []);

  // Cores baseadas no tema
  const borderColor = theme === 'dark' ? '#303030' : '#f0f0f0';
  const bgColorHeader = theme === 'dark' ? '#141414' : '#fafafa';
  const bgColorPanel = theme === 'dark' ? '#1a1a1a' : '#ffffff';

  return (
    <div
      style={{
        flexShrink: 0,
        borderBottom: `1px solid ${borderColor}`,
        background: bgColorHeader,
      }}
    >
      {/* Linha 1: Breadcrumb + Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 35,
          padding: '0 16px',
          borderBottom: isExpanded ? `1px solid ${borderColor}` : 'none',
        }}
      >
        {/* Breadcrumb */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Breadcrumb items={breadcrumb} onNavigate={onBreadcrumbNavigate} theme={theme} />
        </div>

        {/* Botão Toggle */}
        <Button
          type="text"
          size="small"
          icon={<SettingOutlined />}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: 16,
          }}
        >
          Controles {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </Button>
      </div>

      {/* Painel Expandido: 3 LINHAS SEPARADAS (não grid inline) */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: bgColorPanel,
          }}
        >
          {/* LINHA 1: VISUALIZAÇÃO */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${borderColor}`,
              height: 48,
              overflow: 'hidden',
            }}
          >
            {/* Título Vertical à Esquerda */}
            <div
              title="Visualização"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                width: 40,
                padding: '8px 4px',
                background:
                  theme === 'dark'
                    ? 'linear-gradient(to bottom, #1a3a52, #0d2438)'
                    : 'linear-gradient(to bottom, #e6f7ff, #bae7ff)',
                borderRight: `2px solid ${theme === 'dark' ? '#0d5f9f' : '#1890ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: theme === 'dark' ? '#40a9ff' : '#1890ff',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
            >
              📊
            </div>

            {/* Controles à Direita */}
            <div
              style={{
                flex: 1,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* Radio Engenharia/Consumo - SEM size="small" */}
              <Radio.Group
                value={tipoEstrutura}
                onChange={(e) => onTipoEstruturaChange(e.target.value)}
                disabled={isLoading}
              >
                <Radio.Button value="engenharia">Engenharia</Radio.Button>
                <Radio.Button value="consumo">Consumo</Radio.Button>
              </Radio.Group>

              {/* Condicional: Se Consumo, mostra Quantidade e Modo */}
              {tipoEstrutura === 'consumo' && (
                <>
                  <span style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#666' }}>
                    Quantidade:
                  </span>
                  <InputNumber
                    min={0.001}
                    step={1}
                    value={quantidadeMultiplicador}
                    onChange={(val) => onQuantidadeMultiplicadorChange(val || 1)}
                    precision={3}
                    placeholder="Quantidade"
                    style={{ width: 100 }}
                    disabled={isLoading}
                  />

                  <span
                    style={{
                      fontSize: 13,
                      color: theme === 'dark' ? '#999' : '#666',
                      marginLeft: 8,
                    }}
                  >
                    Modo:
                  </span>
                  <Radio.Group
                    value={modoApresentacao}
                    onChange={(e) => onModoApresentacaoChange(e.target.value)}
                    disabled={isLoading}
                  >
                    <Radio.Button value="estrutura">Estrutura</Radio.Button>
                    <Radio.Button value="lista">Lista</Radio.Button>
                  </Radio.Group>
                </>
              )}
            </div>
          </div>

          {/* LINHA 2: FILTROS */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${borderColor}`,
              height: 48,
              overflow: 'hidden',
            }}
          >
            {/* Título Vertical à Esquerda */}
            <div
              title="Filtros"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                width: 40,
                padding: '8px 4px',
                background:
                  theme === 'dark'
                    ? 'linear-gradient(to bottom, #1a3a52, #0d2438)'
                    : 'linear-gradient(to bottom, #d6f0ff, #a3d9ff)',
                borderRight: `2px solid ${theme === 'dark' ? '#4096ff' : '#1677ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: theme === 'dark' ? '#69b1ff' : '#0958d9',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
            >
              🔍
            </div>

            {/* Controles à Direita */}
            <div
              style={{
                flex: 1,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#666' }}>
                Data de referência:
              </span>
              <DatePicker
                value={dayjs(dataReferencia)}
                onChange={(date) => date && onDataReferenciaChange(date.format('YYYY-MM-DD'))}
                format="DD/MM/YYYY"
                allowClear={false}
                style={{
                  width: 140,
                  height: 32,
                  minHeight: 32,
                  maxHeight: 32,
                }}
                disabled={isLoading}
                placeholder="Data"
              />

              {/* Mostrar histórico - só aparece em modo estrutura */}
              {modoApresentacao !== 'lista' && (
                <Checkbox
                  checked={mostrarHistorico}
                  onChange={(e) => onMostrarHistoricoChange(e.target.checked)}
                  disabled={isLoading}
                >
                  Mostrar histórico
                </Checkbox>
              )}

              {/* Campo de busca */}
              <Input
                className="search-input-fixed"
                placeholder="Buscar código..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => onSearchTermChange?.(e.target.value)}
                allowClear
                style={{
                  width: 200,
                  height: 32,
                  minHeight: 32,
                  maxHeight: 32,
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* LINHA 3: EXIBIÇÃO */}
          <div
            style={{
              display: 'flex',
              height: 48,
              overflow: 'hidden',
            }}
          >
            {/* Título Vertical à Esquerda */}
            <div
              title="Exibição"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                width: 40,
                padding: '8px 4px',
                background:
                  theme === 'dark'
                    ? 'linear-gradient(to bottom, #142a3d, #0a1929)'
                    : 'linear-gradient(to bottom, #e6f4ff, #bae0ff)',
                borderRight: `2px solid ${theme === 'dark' ? '#4096ff' : '#69b1ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: theme === 'dark' ? '#85a5ff' : '#1677ff',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
            >
              👁
            </div>

            {/* Controles à Direita */}
            <div
              style={{
                flex: 1,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <Checkbox
                checked={showQty}
                onChange={(e) => onShowQtyChange(e.target.checked)}
                disabled={isLoading}
              >
                Mostrar quantidade
              </Checkbox>

              <span
                style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#666', marginLeft: 8 }}
              >
                Cor base:
              </span>
              <input
                type="color"
                value={baseHex}
                onChange={(e) => onBaseHexChange(e.target.value)}
                title="Cor base"
                disabled={isLoading}
                style={{
                  width: 30,
                  height: 30,
                  padding: 0,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />

              <span style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#666' }}>
                Cor de fundo:
              </span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
                title="Cor de fundo"
                disabled={isLoading}
                style={{
                  width: 30,
                  height: 30,
                  padding: 0,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />

              {/* Nível de expansão - só aparece em modo estrutura */}
              {modoApresentacao !== 'lista' && (
                <>
                  <span
                    style={{
                      fontSize: 13,
                      color: theme === 'dark' ? '#999' : '#666',
                      marginLeft: 12,
                    }}
                  >
                    Nível de expansão:
                  </span>
                  <Slider
                    min={1}
                    max={maxLevel}
                    value={currentLevel}
                    onChange={onLevelChange}
                    marks={{ 1: '1', [maxLevel]: String(maxLevel) }}
                    style={{ width: 200, margin: '0 8px' }}
                    tooltip={{ formatter: (val) => `Nível ${val}` }}
                    disabled={isLoading}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme === 'dark' ? '#40a9ff' : '#1890ff',
                      minWidth: 20,
                    }}
                  >
                    {currentLevel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
