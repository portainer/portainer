import { ComponentType, Suspense } from 'react';

export function withI18nSuspense<T>(
  WrappedComponent: ComponentType<T>
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    return (
      <Suspense fallback="Loading translations...">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WrappedComponent {...props} />
      </Suspense>
    );
  }

  WrapperComponent.displayName = displayName;

  return WrapperComponent;
}
