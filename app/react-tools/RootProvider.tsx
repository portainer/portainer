import { PropsWithChildren, StrictMode } from 'react';

export function RootProvider({ children }: PropsWithChildren<unknown>) {
  return <StrictMode>{children}</StrictMode>;
}
