import { useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { usePublicSettings } from '../settings/queries';

export enum FeatureFlag {
  EdgeRemoteUpdate = 'edgeRemoteUpdate',
}

export function useFeatureFlag(flag: FeatureFlag) {
  return usePublicSettings({
    select: (settings) => settings.Features[flag],
  });
}

export function useRedirectFeatureFlag(
  flag: FeatureFlag,
  to = 'portainer.home'
) {
  const router = useRouter();

  const query = useFeatureFlag(flag);

  useEffect(() => {
    if (query.isSuccess && !query.data) {
      router.stateService.go(to);
    }
  }, [query.data, query.isSuccess, router.stateService, to]);
}
