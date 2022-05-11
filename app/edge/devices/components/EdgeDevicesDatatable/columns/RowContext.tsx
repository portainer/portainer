import { createContext, useContext, useMemo, PropsWithChildren } from 'react';

interface RowContextState {
  isOpenAmtEnabled: boolean;
  groupName?: string;
}

const RowContext = createContext<RowContextState | null>(null);

export interface RowProviderProps {
  groupName?: string;
  isOpenAmtEnabled: boolean;
}

export function RowProvider({
  groupName,
  isOpenAmtEnabled,
  children,
}: PropsWithChildren<RowProviderProps>) {
  const state = useMemo(
    () => ({ groupName, isOpenAmtEnabled }),
    [groupName, isOpenAmtEnabled]
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
