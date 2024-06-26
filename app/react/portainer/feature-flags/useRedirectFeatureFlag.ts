import { useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { FeatureFlag, useFeatureFlag } from './useFeatureFlag';

export function useRedirectFeatureFlag(
  flag: FeatureFlag,
  to = 'portainer.home'
) {
  const router = useRouter();

  const query = useFeatureFlag(flag);

  useEffect(() => {
    if (!query.isLoading && !query.data) {
      router.stateService.go(to);
    }
  }, [query.data, query.isLoading, router.stateService, to]);
}
