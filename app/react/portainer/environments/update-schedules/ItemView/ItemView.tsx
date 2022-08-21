import {
  FeatureFlag,
  useRedirectFeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';

export function ItemView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);

  return <div>Item</div>;
}
