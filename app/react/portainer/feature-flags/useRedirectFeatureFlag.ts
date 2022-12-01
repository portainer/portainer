import { useRouter } from '@uirouter/react';

import { usePublicSettings } from '@/react/portainer/settings/queries';

export enum FeatureFlag {
  BEUpgrade = 'beUpgrade',
}

export function useFeatureFlag(
  flag: FeatureFlag,
  {
    onSuccess,
    enabled = true,
  }: { onSuccess?: (isEnabled: boolean) => void; enabled?: boolean } = {}
) {
  return usePublicSettings<boolean>({
    select: (settings) => settings.Features[flag],
    onSuccess,
    enabled,
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
