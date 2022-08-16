import { QueryClientProvider } from 'react-query';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode } from 'react';

import { UserProvider } from '@/portainer/hooks/useUser';
import { UIStateProvider } from '@/portainer/hooks/UIStateProvider';

import { createQueryClient } from './react-query';

const queryClient = createQueryClient();

export function RootProvider({ children }: PropsWithChildren<unknown>) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <UIStateProvider>
          <UIRouterContextComponent>
            <UserProvider>{children}</UserProvider>
          </UIRouterContextComponent>
        </UIStateProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
