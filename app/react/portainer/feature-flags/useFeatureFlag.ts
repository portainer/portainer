import { usePublicSettings } from '../settings/queries';

export enum FeatureFlag {}

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
