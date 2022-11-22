import { ComponentType } from 'react';

import { FeatureFlag, useFeatureFlag } from './useRedirectFeatureFlag';

export function withFeatureFlag<T>(
  WrappedComponent: ComponentType<T>,
  flag: FeatureFlag
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    const featureFlagQuery = useFeatureFlag(flag);

    if (!featureFlagQuery.data) {
      return null;
    }

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <WrappedComponent {...props} />
    );
  }

  WrapperComponent.displayName = `withFeatureFlag(${displayName})`;

  return WrapperComponent;
}
