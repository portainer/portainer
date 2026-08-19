import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import {
  useTableStateFromUrl,
  parseIntOrDefault,
  parsePositiveIntOrNull,
  asEnum,
} from './useTableStateFromUrl';

const mockSetState = vi.fn();
let mockState: Record<string, unknown> = {};

vi.mock('@/react/hooks/useParamState', () => ({
  usePersistedParamsState: (
    parse: (params: Record<string, unknown>) => Record<string, unknown>
  ) => [parse(mockState), mockSetState] as const,
}));

function setState(partial: Record<string, unknown>) {
  mockState = { ...defaults(), ...partial };
}

function defaults(): Record<string, unknown> {
  return {
    search: '',
    sort: 'name',
    order: 'asc',
    groupBy: null,
    groupFilter: null,
    page: 0,
    pageSize: 10,
  };
}

describe('useTableStateFromUrl', () => {
  beforeEach(() => {
    mockState = defaults();
    mockSetState.mockReset();
  });

  it('returns defaults when state is at defaults', () => {
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

    expect(mockSetState).toHaveBeenCalledWith({ search: 'hello', page: 0 });
  });

  it('setSortBy updates sort and order and resets page to 0', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setSortBy('age', true);
    });

    expect(mockSetState).toHaveBeenCalledWith({
      sort: 'age',
      order: 'desc',
      page: 0,
      groupBy: null,
      groupFilter: null,
    });
  });

  it('setPage updates page only', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setPage(3);
    });

    expect(mockSetState).toHaveBeenCalledWith({ page: 3 });
  });

  it('setPageSize updates URL pageSize and resets page to 0', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setPageSize(25);
    });

    expect(mockSetState).toHaveBeenCalledWith({ pageSize: 25, page: 0 });
  });

  it('reflects state into the table shape', () => {
    setState({ sort: 'age', order: 'desc', pageSize: 25, page: 2 });

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.sortBy).toEqual({ id: 'age', desc: true });
    expect(result.current.pageSize).toBe(25);
    expect(result.current.page).toBe(2);
  });

  it('setGroupBy updates groupBy, resets groupFilter and page', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setGroupBy('status');
    });

    expect(mockSetState).toHaveBeenCalledWith({
      groupBy: 'status',
      groupFilter: null,
      page: 0,
    });
  });

  it('setGroupBy with null clears groupBy', () => {
    setState({ groupBy: 'status' });

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setGroupBy(null);
    });

    expect(mockSetState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      page: 0,
    });
  });

  it('setGroupFilter with a new group sets asc order', () => {
    setState({ groupBy: null, order: 'asc' });

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setGroupFilter({ group: 'status', groupValue: 'healthy' });
    });

    expect(mockSetState).toHaveBeenCalledWith({
      sort: 'status',
      order: 'asc',
      groupBy: 'status',
      groupFilter: 'healthy',
      page: 0,
    });
  });

  it('setGroupFilter with same group and asc order toggles to desc', () => {
    setState({ groupBy: 'status', order: 'asc' });

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setGroupFilter({ group: 'status', groupValue: 'healthy' });
    });

    expect(mockSetState).toHaveBeenCalledWith({
      sort: 'status',
      order: 'desc',
      groupBy: 'status',
      groupFilter: 'healthy',
      page: 0,
    });
  });

  it('setGroupFilter with same group and desc order toggles to asc', () => {
    setState({ groupBy: 'status', order: 'desc' });

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setGroupFilter({ group: 'status', groupValue: null });
    });

    expect(mockSetState).toHaveBeenCalledWith({
      sort: 'status',
      order: 'asc',
      groupBy: 'status',
      groupFilter: null,
      page: 0,
    });
  });

  it('buildExtra result is merged into returned state', () => {
    setState({ sort: 'age' });

    const { result } = renderHook(() =>
      useTableStateFromUrl({
        localStorageKey: 'test',
        defaultSort: 'name',
        buildExtra: (urlState) => ({ computed: urlState.sort }),
      })
    );

    expect(
      (result.current as unknown as Record<string, unknown>).computed
    ).toBe('age');
  });

  it('parseExtra result is merged into urlState', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({
        localStorageKey: 'test',
        defaultSort: 'name',
        parseExtra: (params) => ({ tag: (params.tag as string) ?? 'default' }),
        buildExtra: (urlState) => ({
          tag: (urlState as Record<string, unknown>).tag,
        }),
      })
    );

    expect((result.current as unknown as Record<string, unknown>).tag).toBe(
      'default'
    );
  });

  it('uses defaultGroupBy when groupBy is absent from params', () => {
    mockState = { ...defaults(), groupBy: undefined };

    const { result } = renderHook(() =>
      useTableStateFromUrl({
        localStorageKey: 'test',
        defaultSort: 'name',
        defaultGroupBy: 'type',
      })
    );

    expect(result.current.groupBy).toBe('type');
  });

  it('defaults groupFilter to null when absent from params', () => {
    mockState = { ...defaults(), groupFilter: undefined };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.groupFilter).toBeNull();
  });

  it('defaults order to asc for an unrecognised value', () => {
    mockState = { ...defaults(), order: 'sideways' };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.sortBy?.desc).toBe(false);
  });

  it('defaults pageSize to 10 for a non-positive value', () => {
    mockState = { ...defaults(), pageSize: 0 };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.pageSize).toBe(10);
  });

  it('parses pageSize from a string when coming from URL', () => {
    mockState = { ...defaults(), pageSize: '25' };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.pageSize).toBe(25);
  });

  it('defaults groupBy to null when absent and no defaultGroupBy provided', () => {
    mockState = { ...defaults(), groupBy: undefined };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.groupBy).toBeNull();
  });

  it('defaults search to empty string when absent from params', () => {
    mockState = { ...defaults(), search: undefined };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    expect(result.current.search).toBe('');
  });

  it('defaults sort to defaultSort when absent from params', () => {
    mockState = { ...defaults(), sort: undefined };

    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'custom' })
    );

    expect(result.current.sortBy?.id).toBe('custom');
  });

  it('setSortBy with null id falls back to defaultSort', () => {
    const { result } = renderHook(() =>
      useTableStateFromUrl({ localStorageKey: 'test', defaultSort: 'name' })
    );

    act(() => {
      result.current.setSortBy(undefined, false);
    });

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'name', order: 'asc' })
    );
  });
});

describe('parseIntOrDefault', () => {
  it('parses a valid integer string', () => {
    expect(parseIntOrDefault('42', 0)).toBe(42);
  });

  it('returns fallback for undefined', () => {
    expect(parseIntOrDefault(undefined, 99)).toBe(99);
  });

  it('returns fallback for empty string', () => {
    expect(parseIntOrDefault('', 5)).toBe(5);
  });

  it('returns fallback for non-numeric string', () => {
    expect(parseIntOrDefault('abc', 0)).toBe(0);
  });
});

describe('parsePositiveIntOrNull', () => {
  it('parses a positive integer string', () => {
    expect(parsePositiveIntOrNull('10')).toBe(10);
  });

  it('returns null for zero', () => {
    expect(parsePositiveIntOrNull('0')).toBeNull();
  });

  it('returns null for a negative number', () => {
    expect(parsePositiveIntOrNull('-5')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parsePositiveIntOrNull(undefined)).toBeNull();
  });
});

describe('asEnum', () => {
  const ALLOWED = new Set(['asc', 'desc'] as const);

  it('returns the value when it is in the allowed set', () => {
    expect(asEnum('asc', ALLOWED)).toBe('asc');
  });

  it('returns null when the value is not in the allowed set', () => {
    expect(asEnum('invalid', ALLOWED)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(asEnum(undefined, ALLOWED)).toBeNull();
  });

  it('returns null for null', () => {
    expect(asEnum(null, ALLOWED)).toBeNull();
  });
});
