import { ComponentType } from 'react';

import { UserProvider } from '@/portainer/hooks/useUser';

export function withCurrentUser<T>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <UserProvider>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WrappedComponent {...props} />
      </UserProvider>
    );
  }

  WrapperComponent.displayName = displayName;

  return WrapperComponent;
}
