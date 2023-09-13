import { useRouter } from '@uirouter/react';
import { ComponentType } from 'react';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export function useLimitToBE(defaultPath = 'portainer.home') {
  const router = useRouter();
  if (!isBE) {
    router.stateService.go(defaultPath);
    return true;
  }

  return false;
}

export function withLimitToBE<T>(
  WrappedComponent: ComponentType<T>,
  defaultPath = 'portainer.home'
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    const isLimitedToBE = useLimitToBE(defaultPath);

    if (isLimitedToBE) {
      return null;
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <WrappedComponent {...props} />;
  }

  WrapperComponent.displayName = `withLimitToBE(${displayName})`;

  return WrapperComponent;
}
