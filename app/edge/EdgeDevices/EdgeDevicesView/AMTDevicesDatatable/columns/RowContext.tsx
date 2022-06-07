import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  PropsWithChildren,
} from 'react';
import { EnvironmentId } from 'Portainer/environments/types';

interface RowContextState {
  environmentId: EnvironmentId;
  isLoading: boolean;
  toggleIsLoading(): void;
}

const RowContext = createContext<RowContextState | null>(null);

export interface RowProviderProps {
  environmentId: EnvironmentId;
}

export function RowProvider({
  environmentId,
  children,
}: PropsWithChildren<RowProviderProps>) {
  const [isLoading, toggleIsLoading] = useReducer((state) => !state, false);

  const state = useMemo(
    () => ({ isLoading, toggleIsLoading, environmentId }),
    [isLoading, toggleIsLoading, environmentId]
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
