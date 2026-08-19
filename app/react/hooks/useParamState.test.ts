import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { keyBuilder } from './useLocalStorage';
import {
  useParamState,
  useParamsState,
  usePersistedParamsState,
} from './useParamState';

const mockGo = vi.fn();
let mockUrlParams: Record<string, unknown> = {};

vi.mock('@uirouter/react', () => ({
  useCurrentStateAndParams: () => ({ params: mockUrlParams }),
  useRouter: () => ({ stateService: { go: mockGo } }),
}));

type State = {
  status: string | null;
  sort: string;
  search: string;
};

function parse(params: Record<string, unknown>): State {
  return {
    status: typeof params.status === 'string' ? params.status : null,
    sort: typeof params.sort === 'string' ? params.sort : 'name',
    search: typeof params.search === 'string' ? params.search : '',
  };
}

const STORAGE_KEY = 'test-persisted';
const STORAGE_KEY_FULL = keyBuilder(STORAGE_KEY);
const PERSIST = { storageKey: STORAGE_KEY, persistedKeys: ['status', 'sort'] };

describe('useParamState', () => {
  beforeEach(() => {
    mockUrlParams = {};
    mockGo.mockClear();
  });

  it('returns the param value from URL', () => {
    mockUrlParams = { filter: 'active' };

    const { result } = renderHook(() => useParamState('filter'));

    expect(result.current[0]).toBe('active');
  });

  it('returns undefined when param is absent', () => {
    mockUrlParams = {};

    const { result } = renderHook(() => useParamState('filter'));

    expect(result.current[0]).toBeUndefined();
  });

  it('applies a custom parser', () => {
    mockUrlParams = { count: '7' };

    const { result } = renderHook(() =>
      useParamState('count', (v) => parseInt(v ?? '0', 10))
    );

    expect(result.current[0]).toBe(7);
  });

  it('setter calls router.go with the new value', () => {
    mockUrlParams = { filter: 'active' };

    const { result } = renderHook(() => useParamState('filter'));

    act(() => {
      result.current[1]('inactive');
    });

    expect(mockGo).toHaveBeenCalledWith(
      '.',
      { filter: 'inactive' },
      { reload: false, location: 'replace' }
    );
  });
});

describe('useParamsState', () => {
  beforeEach(() => {
    mockUrlParams = {};
    mockGo.mockClear();
  });

  it('returns parsed state from URL params', () => {
    mockUrlParams = { a: '1', b: '2' };

    const { result } = renderHook(() =>
      useParamsState((params) => ({ a: params.a ?? '', b: params.b ?? '' }))
    );

    expect(result.current[0]).toEqual({ a: '1', b: '2' });
  });

  it('setState calls router.go with the partial update', () => {
    mockUrlParams = { a: '1', b: '2' };

    const { result } = renderHook(() =>
      useParamsState((params) => ({ a: params.a ?? '', b: params.b ?? '' }))
    );

    act(() => {
      result.current[1]({ a: 'updated' });
    });

    expect(mockGo).toHaveBeenCalledWith(
      '.',
      { a: 'updated' },
      { reload: false, location: 'replace' }
    );
  });
});

describe('usePersistedParamsState', () => {
  beforeEach(() => {
    mockUrlParams = {};
    mockGo.mockClear();
    vi.useFakeTimers();
    localStorage.clear();
  });

  it('returns parsed state from URL params', () => {
    mockUrlParams = { status: 'healthy', sort: 'date', search: 'foo' };

    const { result } = renderHook(() =>
      usePersistedParamsState(parse, PERSIST)
    );

    expect(result.current[0]).toEqual({
      status: 'healthy',
      sort: 'date',
      search: 'foo',
    });
  });

  it('falls back to stored values when URL has no persisted keys', () => {
    localStorage.setItem(
      STORAGE_KEY_FULL,
      JSON.stringify({ status: 'error', sort: 'date' })
    );
    mockUrlParams = { search: 'foo' };

    const { result } = renderHook(() =>
      usePersistedParamsState(parse, PERSIST)
    );

    expect(result.current[0].status).toBe('error');
    expect(result.current[0].sort).toBe('date');
    expect(result.current[0].search).toBe('foo');
  });

  it('URL params take precedence; stored values fill in missing URL params', () => {
    localStorage.setItem(
      STORAGE_KEY_FULL,
      JSON.stringify({ status: 'error', sort: 'date' })
    );
    mockUrlParams = { status: 'healthy' };

    const { result } = renderHook(() =>
      usePersistedParamsState(parse, PERSIST)
    );

    expect(result.current[0].status).toBe('healthy');
    expect(result.current[0].sort).toBe('date');
  });

  it('backfills URL from storage on mount when URL has no persisted keys', () => {
    localStorage.setItem(
      STORAGE_KEY_FULL,
      JSON.stringify({ status: 'error', sort: 'date' })
    );
    mockUrlParams = {};

    renderHook(() => usePersistedParamsState(parse, PERSIST));

    expect(mockGo).toHaveBeenCalledWith(
      '.',
      { status: 'error', sort: 'date' },
      { reload: false, location: 'replace' }
    );
  });

  it('backfills only missing URL params when some persisted keys are in URL', () => {
    localStorage.setItem(
      STORAGE_KEY_FULL,
      JSON.stringify({ status: 'error', sort: 'date' })
    );
    mockUrlParams = { status: 'healthy' };

    renderHook(() => usePersistedParamsState(parse, PERSIST));

    expect(mockGo).toHaveBeenCalledWith(
      '.',
      { sort: 'date' },
      { reload: false, location: 'replace' }
    );
  });

  it('does not backfill URL when all persisted keys are already in URL', () => {
    localStorage.setItem(
      STORAGE_KEY_FULL,
      JSON.stringify({ status: 'error', sort: 'date' })
    );
    mockUrlParams = { status: 'healthy', sort: 'name' };

    renderHook(() => usePersistedParamsState(parse, PERSIST));

    expect(mockGo).not.toHaveBeenCalled();
  });

  it('syncs URL params to storage on render when all persisted keys are in URL', () => {
    localStorage.setItem(
      STORAGE_KEY_FULL,
      JSON.stringify({ status: 'error', sort: 'date' })
    );
    mockUrlParams = { status: 'healthy', sort: 'name' };

    renderHook(() => usePersistedParamsState(parse, PERSIST));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_FULL)!);
    expect(stored.status).toBe('healthy');
    expect(stored.sort).toBe('name');
  });

  it('setState writes persisted keys to localStorage', () => {
    mockUrlParams = { status: 'healthy', sort: 'name', search: 'x' };

    const { result } = renderHook(() =>
      usePersistedParamsState(parse, PERSIST)
    );

    act(() => {
      result.current[1]({ status: 'error' } as Partial<State>);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_FULL)!);
    expect(stored.status).toBe('error');
    expect(stored.sort).toBe('name');
  });

  it('setState does not write non-persisted keys to localStorage', () => {
    mockUrlParams = { status: 'healthy', sort: 'name', search: 'x' };

    const { result } = renderHook(() =>
      usePersistedParamsState(parse, PERSIST)
    );

    act(() => {
      result.current[1]({ search: 'new' } as Partial<State>);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_FULL)!);
    expect(stored).not.toHaveProperty('search');
  });

  it('does not write to storage when URL has no persisted keys and storage is empty', () => {
    mockUrlParams = {};

    renderHook(() => usePersistedParamsState(parse, PERSIST));

    expect(localStorage.getItem(STORAGE_KEY_FULL)).toBeNull();
    expect(mockGo).not.toHaveBeenCalled();
  });

  it('works without persist options (pure URL state)', () => {
    mockUrlParams = { status: 'healthy' };

    const { result } = renderHook(() => usePersistedParamsState(parse));

    expect(result.current[0].status).toBe('healthy');

    act(() => {
      result.current[1]({ sort: 'date' } as Partial<State>);
    });

    expect(mockGo).toHaveBeenCalledWith(
      '.',
      { sort: 'date' },
      { reload: false, location: 'replace' }
    );
    expect(localStorage.getItem(STORAGE_KEY_FULL)).toBeNull();
  });
});
