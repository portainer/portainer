import { ComponentType } from 'react';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { withReactQuery } from '@/react-tools/withReactQuery';

export function withTestQueryProvider<T>(
  WrappedComponent: ComponentType<T & JSX.IntrinsicAttributes>,
  {
    onMutationError,
    onQueryError,
  }: {
    onMutationError?(error: unknown): void;
    onQueryError?(error: unknown): void;
  } = {}
) {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    queryCache: new QueryCache({ onError: onQueryError }),
    mutationCache: new MutationCache({
      onError: onMutationError,
    }),
  });

  return withReactQuery(WrappedComponent, testQueryClient);
}
