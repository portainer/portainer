import { ReactQueryDevtools } from 'react-query/devtools';
import { QueryClient, QueryClientProvider } from 'react-query';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode, useState, useEffect } from 'react';

import { UserProvider } from '@/portainer/hooks/useUser';
import { UIStateProvider } from '@/portainer/hooks/UIStateProvider';

const queryClient = new QueryClient();

export function RootProvider({ children }: PropsWithChildren<unknown>) {
  const [showReactQueryDevtools, setShowReactQueryDevtools] = useState(false);
  useEffect(() => {
    if (process.env.SHOW_REACT_QUERY_DEV_TOOLS === 'true') {
      setShowReactQueryDevtools(true);
    }
  }, []);

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <UIStateProvider>
          <UIRouterContextComponent>
            <UserProvider>{children}</UserProvider>
          </UIRouterContextComponent>
        </UIStateProvider>
        {showReactQueryDevtools && <ReactQueryDevtools />}
      </QueryClientProvider>
    </StrictMode>
  );
}
