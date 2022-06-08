import { FeatureId } from '@/portainer/feature-flags/enums';
import { isLimitedFeature } from '@/portainer/feature-flags/feature-flags.service';

const BE_URL = 'https://www.portainer.io/business-upsell?from=';

export function getFeatureDetails(featureId?: FeatureId) {
  if (!featureId) {
    return {};
  }
  const url = `${BE_URL}${featureId}`;

  const limitedToBE = isLimitedFeature(featureId);

  return { url, limitedToBE };
}
