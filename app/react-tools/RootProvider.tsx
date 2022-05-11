import { ReactQueryDevtools } from 'react-query/devtools';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from 'react-query';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import { PropsWithChildren, StrictMode, useState, useEffect } from 'react';

import { UserProvider } from '@/portainer/hooks/useUser';
import { UIStateProvider } from '@/portainer/hooks/UIStateProvider';
import { notifyError } from '@/portainer/services/notifications';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, variable, context, mutation) => {
      handleError(error, mutation.meta?.error);
    },
  }),
  queryCache: new QueryCache({
    onError: (error, mutation) => {
      handleError(error, mutation.meta?.error);
    },
  }),
});

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

function handleError(error: unknown, errorMeta?: unknown) {
  if (errorMeta && typeof errorMeta === 'object') {
    if (!('title' in errorMeta)) {
      return;
    }

    const { title, message } = errorMeta as {
      title: unknown;
      message?: unknown;
    };

    if (typeof title === 'string') {
      notifyError(title, error as Error, message as string);
    }
  }
}
