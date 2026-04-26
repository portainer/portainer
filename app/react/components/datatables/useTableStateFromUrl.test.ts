import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useTableStateFromUrl } from './useTableStateFromUrl';

const mockSetUrlState = vi.fn();
const mockSetStoredPageSize = vi.fn();
let mockUrlParams: Record<string, string | undefined> = {};
let mockStoredPageSize = 10;

vi.mock('@/react/hooks/useParamState', () => ({
  useParamsState: (
    parseParams: (params: Record<string, string | undefined>) => unknown
  ) => [parseParams(mockUrlParams), mockSetUrlState] as const,
}));

vi.mock('@/react/hooks/useLocalStorage', () => ({
  useLocalStorage: () => [mockStoredPageSize, mockSetStoredPageSize],
}));

describe('useTableStateFromUrl', () => {
  beforeEach(() => {
    mockUrlParams = {};
    mockStoredPageSize = 10;
    mockSetUrlState.mockReset();
    mockSetStoredPageSize.mockReset();
  });

  it('returns defaults when URL params are absent', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.search).toBe('');
    expect(result.current.sortBy).toEqual({ id: 'name', desc: false });
    expect(result.current.page).toBe(0);
    expect(result.current.pageSize).toBe(10);
  });

  it('setSearch updates search and resets page to 0', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setSearch('hello');
    });

    expect(mockSetUrlState).toHaveBeenCalledWith({ search: 'hello', page: 0 });
  });

  it('setSortBy updates sort and order and resets page to 0', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setSortBy('age', true);
    });

    expect(mockSetUrlState).toHaveBeenCalledWith({
      sort: 'age',
      order: 'desc',
      page: 0,
    });
  });

  it('setPage updates page only', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setPage(3);
    });

    expect(mockSetUrlState).toHaveBeenCalledWith({ page: 3 });
  });

  it('setPageSize updates localStorage and URL pageSize, resets page to 0', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setPageSize(25);
    });

    expect(mockSetStoredPageSize).toHaveBeenCalledWith(25);
    expect(mockSetUrlState).toHaveBeenCalledWith({ pageSize: 25, page: 0 });
  });

  it('falls back to 0 for invalid page URL param', () => {
    mockUrlParams = { page: 'abc' };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.page).toBe(0);
  });

  it('falls back to localStorage pageSize for invalid pageSize URL param', () => {
    mockUrlParams = { pageSize: 'abc' };
    mockStoredPageSize = 20;

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.pageSize).toBe(20);
  });

  it('sanitizes out-of-range URL params to safe defaults', () => {
    mockUrlParams = { page: '-3', pageSize: '0', order: 'sideways' };
    mockStoredPageSize = 15;

    const defaultSort = 'sorting';

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort })
    );

    expect(result.current.page).toBe(0);
    expect(result.current.pageSize).toBe(15);
    expect(result.current.sortBy?.desc).toBe(false);
    expect(result.current.search).toBe('');
    expect(result.current.sortBy?.id).toBe(defaultSort);
  });
});
