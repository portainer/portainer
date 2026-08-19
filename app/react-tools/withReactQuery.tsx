import { ComponentType } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient as defaultQueryClient } from './react-query';

export function withReactQuery<T>(
  WrappedComponent: ComponentType<T & JSX.IntrinsicAttributes>,
  queryClient = defaultQueryClient
): ComponentType<T & JSX.IntrinsicAttributes> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    return (
      <QueryClientProvider client={queryClient}>
        <WrappedComponent {...props} />
      </QueryClientProvider>
    );
  }

  WrapperComponent.displayName = `withReactQuery(${displayName})`;

  return WrapperComponent;
}
