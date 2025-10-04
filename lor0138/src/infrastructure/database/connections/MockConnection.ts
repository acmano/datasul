import { IConnection, QueryParameter } from '../types';

export class MockConnection implements IConnection {
  private mockData = {
    item: {
      itemCodigo: 'MOCK001',
      itemDescricao: 'Item Mock para Testes',
      itemUnidade: 'UN',
    },
    estabelecimentos: [
      {
        itemCodigo: 'MOCK001',
        estabCodigo: '01',
        estabNome: 'Estabelecimento Mock',
        codObsoleto: 0,
      },
    ],
  };

  async connect(): Promise<void> {
    console.log('Mock connection iniciada');
  }

  async query(queryString: string): Promise<any> {
    console.log('Mock query executada:', queryString);

    if (queryString.includes('pub.item')) {
      return [this.mockData.item];
    }

    if (queryString.includes('item-uni-estab')) {
      return this.mockData.estabelecimentos;
    }

    return [];
  }

  async queryWithParams(queryString: string, params: QueryParameter[]): Promise<any> {
    console.log('Mock query parametrizada:', queryString, params);

    if (queryString.includes('pub.item')) {
      return [this.mockData.item];
    }

    if (queryString.includes('item-uni-estab')) {
      return this.mockData.estabelecimentos;
    }

    return [];
  }

  async close(): Promise<void> {
    console.log('Mock connection fechada');
  }

  isConnected(): boolean {
    return true;
  }
}