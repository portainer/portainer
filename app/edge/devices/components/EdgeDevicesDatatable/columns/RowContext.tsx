import { createContext, useContext, useMemo, PropsWithChildren } from 'react';

interface RowContextState {
  disableTrustOnFirstConnect: boolean;
}

const RowContext = createContext<RowContextState | null>(null);

export interface RowProviderProps {
  disableTrustOnFirstConnect: boolean;
}

export function RowProvider({
  disableTrustOnFirstConnect,
  children,
}: PropsWithChildren<RowProviderProps>) {
  const state = useMemo(
    () => ({ disableTrustOnFirstConnect }),
    [disableTrustOnFirstConnect]
  );

  return <RowContext.Provider value={state}>{children}</RowContext.Provider>;
}

export function useRowContext() {
  const context = useContext(RowContext);
  if (!context) {
    throw new Error('should be nested under RowProvider');
  }

  return context;
}
