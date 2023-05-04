import { useRouter } from '@uirouter/react';

import { FeatureFlag, useFeatureFlag } from './useFeatureFlag';

export function useRedirectFeatureFlag(
  flag: FeatureFlag,
  to = 'portainer.home'
) {
  const router = useRouter();

  useFeatureFlag(flag, {
    onSuccess(isEnabled) {
      if (!isEnabled) {
        router.stateService.go(to);
      }
    },
  });
}
