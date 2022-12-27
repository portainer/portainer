import { ComponentType } from 'react';

/**
 * Hides the wrapped component if portainer is running as a docker extension.
 */
export function withHideOnExtension<T>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    if (window.ddExtension) {
      return null;
    }

    return <WrappedComponent {...props} />;
  }

  WrapperComponent.displayName = `withHideOnExtension(${displayName})`;

  return WrapperComponent;
}
