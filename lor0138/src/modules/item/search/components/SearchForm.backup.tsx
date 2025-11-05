import React, { useEffect, useRef } from 'react';
import { Form, Input, Select, Button, Row, Col } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ItemSearchFilters } from '../types/search.types';
import { Familia } from '../../../../shared/services/familia.service';
import { FamiliaComercial } from '../../../../shared/services/familiaComercial.service';
import { GrupoDeEstoque } from '../../../../shared/services/grupoDeEstoque.service';

const { Option } = Select;

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

  // Foco automático no campo código ao montar
  useEffect(() => {
    if (autoFocus && codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <Form layout="vertical" onFinish={onSearch}>
      <Row gutter={12} align="bottom" style={{ width: '100%' }}>
        <Col flex="0 0 180px">
          <Form.Item label="Código" style={{ marginBottom: 0 }}>
            <Input
              ref={codigoInputRef}
              value={filters.itemCodigo}
              onChange={(e) => onChange({ itemCodigo: e.target.value })}
              placeholder="Código"
            />
          </Form.Item>
        </Col>

        <Col flex="1 1 300px">
          <Form.Item label="Descrição" style={{ marginBottom: 0 }}>
            <Input
              value={filters.itemDescricao}
              onChange={(e) => onChange({ itemDescricao: e.target.value })}
              placeholder="Descrição"
            />
          </Form.Item>
        </Col>

        <Col flex="0 0 180px">
          <Form.Item label="GTIN" style={{ marginBottom: 0 }}>
            <Input
              value={filters.gtin}
              onChange={(e) => onChange({ gtin: e.target.value })}
              placeholder="GTIN"
            />
          </Form.Item>
        </Col>

        <Col flex="0 0 90px">
          <Button icon={<ClearOutlined />} onClick={onClear} style={{ width: '100%' }}>
            Limpar
          </Button>
        </Col>
      </Row>

      <Row gutter={12} align="bottom" style={{ width: '100%' }}>
        <Col flex="1">
          <Form.Item label="Família" style={{ marginBottom: 0 }}>
            <Select
              value={filters.familiaCodigo || undefined}
              onChange={(value) => onChange({ familiaCodigo: value })}
              placeholder="Selecione"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {familias.map((f) => (
                <Option key={f.codigo} value={f.codigo}>
                  {f.codigo} - {f.descricao}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col flex="1">
          <Form.Item label="Família Comercial" style={{ marginBottom: 0 }}>
            <Select
              value={filters.familiaComercialCodigo || undefined}
              onChange={(value) => onChange({ familiaComercialCodigo: value })}
              placeholder="Selecione"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {familiasComerciais.map((fc) => (
                <Option key={fc.codigo} value={fc.codigo}>
                  {fc.codigo} - {fc.descricao}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col flex="1">
          <Form.Item label="Grupo de Estoque" style={{ marginBottom: 0 }}>
            <Select
              value={filters.grupoEstoqueCodigo || undefined}
              onChange={(value) => onChange({ grupoEstoqueCodigo: value })}
              placeholder="Selecione"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {gruposDeEstoque.map((ge) => (
                <Option key={ge.codigo} value={ge.codigo}>
                  {ge.codigo} - {ge.descricao}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col flex="1">
          <Form.Item label="Tipo do Item" style={{ marginBottom: 0 }}>
            <Select
              mode="multiple"
              value={filters.tipoItem || undefined}
              onChange={(value) => onChange({ tipoItem: value })}
              placeholder="Selecione"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {tipoItemOptions.map((tipo) => (
                <Option key={tipo.codigo} value={tipo.codigo}>
                  {tipo.codigo} - {tipo.descricao}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col flex="0 0 90px">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={onSearch}
            loading={loading}
            style={{ width: '100%' }}
          >
            Buscar
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchForm;
