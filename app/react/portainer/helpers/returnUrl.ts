import { get, set, keyBuilder } from '@/react/hooks/useLocalStorage';

const KEY = 'RETURN_URL';

export function storeReturnUrl(url: string): void {
  set(KEY, url);
}

export function getReturnUrl(): string | null {
  return get<string | null>(KEY, null);
}

export function cleanReturnUrl(): void {
  localStorage.removeItem(keyBuilder(KEY));
}
