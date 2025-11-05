import React from 'react';
import { Card, Descriptions, Badge, Divider, Typography, Space, Tag } from 'antd';
import {
  FileTextOutlined,
  BarcodeOutlined,
  AppstoreOutlined,
  TagsOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ItemDetailCardProps {
  item: {
    itemCodigo: string;
    itemDescricao: string;
    gtin?: string;
    unidadeMedida?: string;
    unidadeDescricao?: string;
    familiaCodigo?: string;
    familiaDescricao?: string;
    tipoItem?: string;
    tipoItemDescricao?: string;
    narrativa?: string;
  };
}

const ItemDetailCard: React.FC<ItemDetailCardProps> = ({ item }) => {
  return (
    <Card
      bordered={false}
      style={{
        height: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header do Card */}
      <div style={{ marginBottom: 24 }}>
        <Space align="start" size={12}>
          <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              {item.itemCodigo} - {item.itemDescricao}
            </Title>
            {item.tipoItemDescricao && (
              <Badge status="success" text={item.tipoItemDescricao} style={{ fontSize: 13 }} />
            )}
          </div>
        </Space>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Informações Principais - Grid */}
      <Descriptions
        column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
        bordered={false}
        size="middle"
        labelStyle={{
          fontWeight: 500,
          color: '#595959',
          width: '40%',
        }}
        contentStyle={{
          color: '#262626',
          fontWeight: 400,
        }}
      >
        {item.gtin && (
          <Descriptions.Item
            label={
              <Space size={4}>
                <BarcodeOutlined />
                GTIN
              </Space>
            }
          >
            <Text copyable>{item.gtin}</Text>
          </Descriptions.Item>
        )}

        {item.unidadeMedida && (
          <Descriptions.Item label="Unidade de Medida">
            <Tag color="blue">{item.unidadeMedida}</Tag>
            {item.unidadeDescricao && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                ({item.unidadeDescricao})
              </Text>
            )}
          </Descriptions.Item>
        )}

        {item.familiaCodigo && (
          <Descriptions.Item
            label={
              <Space size={4}>
                <AppstoreOutlined />
                Família
              </Space>
            }
          >
            {item.familiaCodigo}
            {item.familiaDescricao && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                - {item.familiaDescricao}
              </Text>
            )}
          </Descriptions.Item>
        )}

        {item.tipoItem && (
          <Descriptions.Item
            label={
              <Space size={4}>
                <TagsOutlined />
                Tipo
              </Space>
            }
          >
            {item.tipoItem}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Narrativa / Histórico */}
      {item.narrativa && (
        <>
          <Divider style={{ margin: '24px 0 16px 0' }} />
          <div>
            <Title level={5} style={{ marginBottom: 12, color: '#595959' }}>
              Histórico de Alterações
            </Title>
            <Paragraph
              style={{
                background: '#fafafa',
                padding: 16,
                borderRadius: 6,
                border: '1px solid #f0f0f0',
                marginBottom: 0,
                fontSize: 13,
                lineHeight: '1.8',
                color: '#595959',
              }}
            >
              {item.narrativa}
            </Paragraph>
          </div>
        </>
      )}
    </Card>
  );
};

export default ItemDetailCard;
