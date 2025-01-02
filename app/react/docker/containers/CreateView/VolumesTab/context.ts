import { createContext, useContext } from 'react';

export const InputContext = createContext<{
  allowAuto: boolean;
  allowBindMounts: boolean;
} | null>(null);

export function useInputContext() {
  const value = useContext(InputContext);

  if (value === null) {
    throw new Error('useContext must be used within a Context.Provider');
  }

  return value;
}
