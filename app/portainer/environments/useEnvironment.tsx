import { createContext, ReactNode, useContext } from 'react';

import type { Environment } from './types';

const EnvironmentContext = createContext<Environment | null>(null);

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === null) {
    throw new Error('must be nested under EnvironmentProvider');
  }

  return context;
}

interface Props {
  children: ReactNode;
  environment: Environment;
}

export function EnvironmentProvider({ children, environment }: Props) {
  return (
    <EnvironmentContext.Provider value={environment}>
      {children}
    </EnvironmentContext.Provider>
  );
}
