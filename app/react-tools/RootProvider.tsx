import { QueryClientProvider } from 'react-query';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode } from 'react';

import { createQueryClient } from './react-query';

const queryClient = createQueryClient();

export function RootProvider({ children }: PropsWithChildren<unknown>) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <UIRouterContextComponent>{children}</UIRouterContextComponent>
      </QueryClientProvider>
    </StrictMode>
  );
}
