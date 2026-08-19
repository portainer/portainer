import { ComponentType } from 'react';

import { UserProvider } from '@/react/hooks/useUser';

import { withReactQuery } from './withReactQuery';

export function withCurrentUser<T>(
  WrappedComponent: ComponentType<T & JSX.IntrinsicAttributes>
): ComponentType<T & JSX.IntrinsicAttributes> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    return (
      <UserProvider>
        <WrappedComponent {...props} />
      </UserProvider>
    );
  }

  WrapperComponent.displayName = `withCurrentUser(${displayName})`;

  // User provider makes a call to the API to get the current user.
  // We need to wrap it with React Query to make that call.
  return withReactQuery(WrapperComponent);
}
