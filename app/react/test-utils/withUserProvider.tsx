import { ComponentType, useMemo } from 'react';

import { UserContext } from '@/react/hooks/useUser';
import { User } from '@/portainer/users/types';

const mockUser: User = {
  EndpointAuthorizations: [],
  Id: 1,
  Role: 1,
  Username: 'mock',
  UseCache: false,
  ThemeSettings: {
    color: 'auto',
  },
};

/**
 * A helper function to wrap a component with a UserContext.Provider.
 *
 * should only be used in tests
 */
export function withUserProvider<T>(
  WrappedComponent: ComponentType<T>,
  user = mockUser
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    const state = useMemo(() => ({ user }), []);

    return (
      <UserContext.Provider value={state}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WrappedComponent {...props} />
      </UserContext.Provider>
    );
  }

  WrapperComponent.displayName = `withUserProvider(${displayName})`;

  return WrapperComponent;
}
