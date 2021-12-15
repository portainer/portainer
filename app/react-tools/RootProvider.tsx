import { ReactQueryDevtools } from 'react-query/devtools';
import { QueryClient, QueryClientProvider } from 'react-query';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode, useState, useEffect } from 'react';

import { UserProvider } from '@/portainer/hooks/useUser';

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
        <UIRouterContextComponent>
          <UserProvider>{children}</UserProvider>
        </UIRouterContextComponent>
        {showReactQueryDevtools && <ReactQueryDevtools />}
      </QueryClientProvider>
    </StrictMode>
  );
}
