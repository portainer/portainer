import { ComponentType } from 'react';

export function withEdition<T>(
  WrappedComponent: ComponentType<T>,
  edition: 'BE' | 'CE'
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    if (process.env.PORTAINER_EDITION !== edition) {
      return null;
    }

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <WrappedComponent {...props} />
    );
  }

  WrapperComponent.displayName = `withEdition(${displayName})`;

  return WrapperComponent;
}
