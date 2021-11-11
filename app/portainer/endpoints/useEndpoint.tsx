import { createContext, ReactNode, useContext } from 'react';

import type { Endpoint } from './types';

const EndpointContext = createContext<Endpoint | null>(null);

export function useEndpoint() {
  const context = useContext(EndpointContext);
  if (context === null) {
    throw new Error('must be nested under EndpointProvider');
  }

  return context;
}

interface Props {
  children: ReactNode;
  endpoint: Endpoint;
}

export function EndpointProvider({ children, endpoint }: Props) {
  return (
    <EndpointContext.Provider value={endpoint}>
      {children}
    </EndpointContext.Provider>
  );
}
