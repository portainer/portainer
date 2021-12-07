import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode } from 'react';

export function RootProvider({ children }: PropsWithChildren<unknown>) {
  return (
    <StrictMode>
      <UIRouterContextComponent>{children}</UIRouterContextComponent>
    </StrictMode>
  );
}
