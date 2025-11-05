import { renderHook, act } from '@testing-library/react';
import { useSearchFilters } from './useSearchFilters';
import { message } from 'antd';

jest.mock('@modules/item/search/services/itemSearch.service');
jest.mock('antd', () => ({
  message: {
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@shared/utils/errorHandler', () => ({
  handleError: jest.fn(),
}));

describe('useSearchFilters', () => {
  const mockNavigateToItem = jest.fn();
  const mockNavigateToSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() =>
      useSearchFilters({
        navigateToItem: mockNavigateToItem,
        navigateToSearch: mockNavigateToSearch,
        currentModule: '1',
      })
    );

    expect(result.current.filtros).toEqual({});
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.selectedRowKey).toBeNull();
  });

  it('deve atualizar filtros', () => {
    const { result } = renderHook(() =>
      useSearchFilters({
        navigateToItem: mockNavigateToItem,
        navigateToSearch: mockNavigateToSearch,
        currentModule: '1',
      })
    );

    act(() => {
      result.current.handleFilterChange({ itemCodigo: '123' });
    });

    expect(result.current.filtros).toEqual({ itemCodigo: '123' });
  });

  it('deve limpar filtros e resultados', () => {
    const { result } = renderHook(() =>
      useSearchFilters({
        navigateToItem: mockNavigateToItem,
        navigateToSearch: mockNavigateToSearch,
        currentModule: '1',
      })
    );

    act(() => {
      result.current.handleFilterChange({ itemCodigo: '123' });
    });

    act(() => {
      result.current.handleClear();
    });

    expect(result.current.filtros).toEqual({});
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.selectedRowKey).toBeNull();
    expect(mockNavigateToSearch).toHaveBeenCalled();
  });

  it('deve mostrar warning se buscar sem filtros', async () => {
    const { result } = renderHook(() =>
      useSearchFilters({
        navigateToItem: mockNavigateToItem,
        navigateToSearch: mockNavigateToSearch,
        currentModule: '1',
      })
    );

    await act(async () => {
      await result.current.handleSearch();
    });

    expect(message.warning).toHaveBeenCalledWith('Informe ao menos um filtro para pesquisar');
  });
});
