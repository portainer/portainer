import { PropsWithChildren } from 'react';

import { FeatureId } from '@/portainer/feature-flags/enums';

import { getFeatureDetails } from './utils';

export interface Props {
  featureId?: FeatureId;
}

export function BEFeatureIndicator({
  featureId,
  children,
}: PropsWithChildren<Props>) {
  const { url, limitedToBE } = getFeatureDetails(featureId);

  if (!limitedToBE) {
    return null;
  }

  return (
    <a
      className="be-indicator"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <i className="fas fa-briefcase space-right be-indicator-icon" />
      <span className="be-indicator-label">Business Edition Feature</span>
    </a>
  );
}
