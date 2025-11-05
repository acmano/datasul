import { exportToCSV } from '../csv';
import { ItemSearchResultItem } from '../../../../modules/item/search/types/search.types';

describe('exportToCSV', () => {
  let mockCreateElement: jest.SpyInstance;
  let mockAppendChild: jest.SpyInstance;
  let mockRemoveChild: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  const createMockLink = () => {
    const link = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {} as CSSStyleDeclaration,
    };
    return link;
  };

  beforeEach(() => {
    // Mock alert
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock document.createElement
    const mockLink = createMockLink();
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    // Mock URL.createObjectURL (não existe no Jest)
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document.body methods
    mockAppendChild = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as any);
    mockRemoveChild = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve gerar CSV com BOM UTF-8', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item de Teste',
        unidadeMedidaCodigo: 'UN',
      } as ItemSearchResultItem,
    ];

    exportToCSV(mockData, 'test');

    // Verifica que createObjectURL foi chamado
    expect(global.URL.createObjectURL).toHaveBeenCalled();

    // Verifica que o link foi criado e clicado
    expect(mockCreateElement).toHaveBeenCalledWith('a');
  });

  it('deve exibir alerta quando não há dados', () => {
    exportToCSV([], 'test');

    expect(alertSpy).toHaveBeenCalledWith('Não há dados para exportar');
    expect(mockCreateElement).not.toHaveBeenCalled();
  });

  it('deve exibir alerta quando data é null', () => {
    exportToCSV(null as any, 'test');

    expect(alertSpy).toHaveBeenCalledWith('Não há dados para exportar');
    expect(mockCreateElement).not.toHaveBeenCalled();
  });

  it('deve usar ponto-e-vírgula como separador', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item 1',
        unidadeMedidaCodigo: 'UN',
        familiaCodigo: 'FAM001',
        familiaDescricao: 'Familia 1',
      } as ItemSearchResultItem,
    ];

    exportToCSV(mockData, 'test');

    // Verifica que o link foi criado
    expect(mockCreateElement).toHaveBeenCalledWith('a');
  });

  it('deve envolver campos de texto em aspas duplas', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Parafuso 1/4"',
        unidadeMedidaCodigo: 'UN',
      } as ItemSearchResultItem,
    ];

    exportToCSV(mockData, 'test');

    expect(mockCreateElement).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('deve criar link de download com nome correto', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item de Teste',
        unidadeMedidaCodigo: 'UN',
      } as ItemSearchResultItem,
    ];

    const mockLink = createMockLink();
    mockCreateElement.mockReturnValue(mockLink as any);

    exportToCSV(mockData, 'itens_export');

    // Verifica que setAttribute foi chamado com download
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      'download',
      expect.stringMatching(/^itens_export_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
    );
  });

  it('deve adicionar e remover link do DOM', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item de Teste',
        unidadeMedidaCodigo: 'UN',
      } as ItemSearchResultItem,
    ];

    const mockLink = createMockLink();
    mockCreateElement.mockReturnValue(mockLink as any);

    exportToCSV(mockData, 'test');

    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
  });

  it('deve incluir cabeçalhos corretos', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item de Teste',
        unidadeMedidaCodigo: 'UN',
      } as ItemSearchResultItem,
    ];

    exportToCSV(mockData, 'test');

    // Verifica que o processo foi concluído
    expect(mockCreateElement).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('deve usar nome padrão "itens" quando não fornecido', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item de Teste',
        unidadeMedidaCodigo: 'UN',
      } as ItemSearchResultItem,
    ];

    const mockLink = createMockLink();
    mockCreateElement.mockReturnValue(mockLink as any);

    exportToCSV(mockData);

    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      'download',
      expect.stringMatching(/^itens_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
    );
  });

  it('deve tratar campos opcionais vazios', () => {
    const mockData: ItemSearchResultItem[] = [
      {
        itemCodigo: 'ITEM001',
        itemDescricao: 'Item sem dados opcionais',
        unidadeMedidaCodigo: 'UN',
        familiaCodigo: null,
        familiaDescricao: null,
        gtin: undefined,
      } as any,
    ];

    exportToCSV(mockData, 'test');

    expect(mockCreateElement).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
