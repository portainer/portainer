import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode } from 'react';

import { UserProvider } from '@/portainer/hooks/useUser';

export function RootProvider({ children }: PropsWithChildren<unknown>) {
  return (
    <StrictMode>
      <UIRouterContextComponent>
        <UserProvider>{children}</UserProvider>
      </UIRouterContextComponent>
    </StrictMode>
  );
}
