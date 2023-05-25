import { ComponentType } from 'react';

export function withEdition<T>(
  WrappedComponent: ComponentType<T>,
  edition: 'BE' | 'CE'
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    if (process.env.PORTAINER_EDITION !== edition) {
      return null;
    }

    return <WrappedComponent {...props} />;
  }

  WrapperComponent.displayName = `with${edition}Edition(${displayName})`;

  return WrapperComponent;
}
