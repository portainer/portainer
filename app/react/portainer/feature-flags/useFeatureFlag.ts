import { usePublicSettings } from '../settings/queries';

export enum FeatureFlag {
  FDO = 'fdo',
}

export function useFeatureFlag(
  flag: FeatureFlag,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return usePublicSettings<boolean>({
    select: (settings) => settings.Features[flag],
    enabled,
  });
}
