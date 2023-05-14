import { ComponentType } from 'react';

import { FeatureFlag, useFeatureFlag } from './useFeatureFlag';

export function withFeatureFlag<T>(
  WrappedComponent: ComponentType<T>,
  flag: FeatureFlag
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    const featureFlagQuery = useFeatureFlag(flag);

    if (!featureFlagQuery.data) {
      return null;
    }

    return <WrappedComponent {...props} />;
  }

  WrapperComponent.displayName = `with${flag}FeatureFlag(${displayName})`;

  return WrapperComponent;
}
