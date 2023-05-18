import { ComponentType } from 'react';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';

export function withUIRouter<T>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    return (
      <UIRouterContextComponent>
        <WrappedComponent {...props} />
      </UIRouterContextComponent>
    );
  }

  WrapperComponent.displayName = `withUIRouter(${displayName})`;

  return WrapperComponent;
}
