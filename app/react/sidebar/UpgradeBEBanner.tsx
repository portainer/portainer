import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import {
  useFeatureFlag,
  FeatureFlag,
} from '@/react/portainer/feature-flags/useRedirectFeatureFlag';

export function UpgradeBEBanner() {
  const { data } = useFeatureFlag(FeatureFlag.BEUpgrade, { enabled: !isBE });

  if (isBE || !data) {
    return null;
  }

  return <div>upgrade to be</div>;
}
