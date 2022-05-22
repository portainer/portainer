import { createContext, useContext, useMemo, PropsWithChildren } from 'react';

interface RowContextState {
  isOpenAmtEnabled: boolean;
}

const RowContext = createContext<RowContextState | null>(null);

export interface RowProviderProps {
  isOpenAmtEnabled: boolean;
}

export function RowProvider({
  isOpenAmtEnabled,
  children,
}: PropsWithChildren<RowProviderProps>) {
  const state = useMemo(() => ({ isOpenAmtEnabled }), [isOpenAmtEnabled]);

  return <RowContext.Provider value={state}>{children}</RowContext.Provider>;
}

export function useRowContext() {
  const context = useContext(RowContext);
  if (!context) {
    throw new Error('should be nested under RowProvider');
  }

  return context;
}
