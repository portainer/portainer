import { useLocalStorage } from './useLocalStorage';

export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  return useLocalStorage<T>(key, defaultValue, sessionStorage);
}
