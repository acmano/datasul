import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Select, Button, Row, Col, Card, Collapse, Space, Badge } from 'antd';
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { ItemSearchFilters } from '../types/search.types';
import { Familia } from '../../../../shared/services/familia.service';
import { FamiliaComercial } from '../../../../shared/services/familiaComercial.service';
import { GrupoDeEstoque } from '../../../../shared/services/grupoDeEstoque.service';

const { Option } = Select;
const { Panel } = Collapse;

const tipoItemOptions = [
  { codigo: '0', descricao: 'Mercadoria para Revenda' },
  { codigo: '1', descricao: 'Matéria-prima' },
  { codigo: '2', descricao: 'Embalagem' },
  { codigo: '3', descricao: 'Produto em Processo' },
  { codigo: '4', descricao: 'Produto Acabado' },
  { codigo: '5', descricao: 'Subproduto' },
  { codigo: '6', descricao: 'Produto Intermediário' },
  { codigo: '7', descricao: 'Material de Uso e Consumo' },
  { codigo: '8', descricao: 'Ativo Imobilizado' },
  { codigo: '9', descricao: 'Serviços' },
  { codigo: '10', descricao: 'Outros Insumos' },
  { codigo: '99', descricao: 'Outras' },
];

interface SearchFormProps {
  filters: ItemSearchFilters;
  familias: Familia[];
  familiasComerciais: FamiliaComercial[];
  gruposDeEstoque: GrupoDeEstoque[];
  loading: boolean;
  onChange: (changedValues: Partial<ItemSearchFilters>) => void;
  onSearch: () => void;
  onClear: () => void;
  autoFocus?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  filters,
  familias,
  familiasComerciais,
  gruposDeEstoque,
  loading,
  onChange,
  onSearch,
  onClear,
  autoFocus = true,
}) => {
  const codigoInputRef = useRef<any>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Conta quantos filtros avançados estão ativos
  const activeFiltersCount = [
    filters.familiaCodigo,
    filters.familiaComercialCodigo,
    filters.grupoEstoqueCodigo,
    filters.tipoItem?.length,
  ].filter(Boolean).length;

  // Foco automático no campo código ao montar
  useEffect(() => {
    if (autoFocus && codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, [autoFocus]);

  // Handler para limpar todos os filtros
  const handleClear = () => {
    onClear();
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  };

  // Handler para busca com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: 8,
      }}
    >
      <Form layout="vertical" onFinish={onSearch}>
        {/* BUSCA RÁPIDA - Sempre visível */}
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={24} md={10} lg={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Código</span>}
                style={{ marginBottom: 0 }}
              >
                <Input
                  ref={codigoInputRef}
                  value={filters.itemCodigo}
                  onChange={(e) => onChange({ itemCodigo: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite o código do item"
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={14} lg={10}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Descrição</span>}
                style={{ marginBottom: 0 }}
              >
                <Input
                  value={filters.itemDescricao}
                  onChange={(e) => onChange({ itemDescricao: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite a descrição do item"
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12} lg={3}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={onSearch}
                  loading={loading}
                  size="large"
                  block
                  style={{
                    height: 40,
                    borderRadius: 6,
                    fontWeight: 500,
                  }}
                >
                  Buscar
                </Button>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12} lg={3}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  size="large"
                  block
                  style={{
                    height: 40,
                    borderRadius: 6,
                  }}
                >
                  Limpar
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* FILTROS AVANÇADOS - Colapsável */}
        <Collapse
          activeKey={advancedFiltersOpen ? ['1'] : []}
          onChange={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
          ghost
          style={{ background: 'transparent' }}
        >
          <Panel
            header={
              <Space>
                <FilterOutlined />
                <span style={{ fontWeight: 500 }}>Filtros Avançados</span>
                {activeFiltersCount > 0 && (
                  <Badge count={activeFiltersCount} style={{ backgroundColor: '#1890ff' }} />
                )}
              </Space>
            }
            key="1"
          >
            <div style={{ padding: '16px 0' }}>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={12} lg={6}>
                  <Form.Item
                    label={<span style={{ fontWeight: 500 }}>GTIN</span>}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      value={filters.gtin}
                      onChange={(e) => onChange({ gtin: e.target.value })}
                      onKeyPress={handleKeyPress}
                      placeholder="Código GTIN"
                      style={{ borderRadius: 6 }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <Form.Item
                    label={<span style={{ fontWeight: 500 }}>Família</span>}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      value={filters.familiaCodigo || undefined}
                      onChange={(value) => onChange({ familiaCodigo: value })}
                      placeholder="Selecione a família"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      style={{ width: '100%' }}
                    >
                      {familias.map((f) => (
                        <Option key={f.codigo} value={f.codigo}>
                          {f.codigo} - {f.descricao}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <Form.Item
                    label={<span style={{ fontWeight: 500 }}>Família Comercial</span>}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      value={filters.familiaComercialCodigo || undefined}
                      onChange={(value) => onChange({ familiaComercialCodigo: value })}
                      placeholder="Selecione a família comercial"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      style={{ width: '100%' }}
                    >
                      {familiasComerciais.map((fc) => (
                        <Option key={fc.codigo} value={fc.codigo}>
                          {fc.codigo} - {fc.descricao}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <Form.Item
                    label={<span style={{ fontWeight: 500 }}>Grupo de Estoque</span>}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      value={filters.grupoEstoqueCodigo || undefined}
                      onChange={(value) => onChange({ grupoEstoqueCodigo: value })}
                      placeholder="Selecione o grupo de estoque"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      style={{ width: '100%' }}
                    >
                      {gruposDeEstoque.map((ge) => (
                        <Option key={ge.codigo} value={ge.codigo}>
                          {ge.codigo} - {ge.descricao}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={24} lg={24}>
                  <Form.Item
                    label={<span style={{ fontWeight: 500 }}>Tipo do Item</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      mode="multiple"
                      value={filters.tipoItem || undefined}
                      onChange={(value) => onChange({ tipoItem: value })}
                      placeholder="Selecione um ou mais tipos de item"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      {tipoItemOptions.map((tipo) => (
                        <Option key={tipo.codigo} value={tipo.codigo}>
                          {tipo.codigo} - {tipo.descricao}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Panel>
        </Collapse>
      </Form>
    </Card>
  );
};

export default SearchForm;
