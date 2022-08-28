import { ComponentType } from 'react';
import { UIRouterContextComponent } from '@uirouter/react-hybrid';

export function withUIRouter<T>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <UIRouterContextComponent>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WrappedComponent {...props} />
      </UIRouterContextComponent>
    );
  }

  WrapperComponent.displayName = displayName;

  return WrapperComponent;
}
