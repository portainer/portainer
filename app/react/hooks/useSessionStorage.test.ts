import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect, beforeEach } from 'vitest';

import { keyBuilder } from './useLocalStorage';
import { useSessionStorage } from './useSessionStorage';

const KEY = 'test-key';
const STORAGE_KEY = keyBuilder(KEY);

describe('useSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('returns defaultValue when nothing is stored', () => {
    const { result } = renderHook(() => useSessionStorage(KEY, 42));

    expect(result.current[0]).toBe(42);
  });

  it('stores value in sessionStorage, not localStorage', () => {
    const { result } = renderHook(() => useSessionStorage(KEY, 0));

    act(() => {
      result.current[1](99);
    });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('99');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
