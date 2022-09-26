import { useRouter } from '@uirouter/react';

import { usePublicSettings } from '@/react/portainer/settings/queries';

export enum FeatureFlag {
  EdgeRemoteUpdate = 'edgeRemoteUpdate',
}

export function useFeatureFlag(
  flag: FeatureFlag,
  { onSuccess }: { onSuccess?: (isEnabled: boolean) => void } = {}
) {
  return usePublicSettings<boolean>({
    select: (settings) => settings.Features[flag],
    onSuccess,
  });
}

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
