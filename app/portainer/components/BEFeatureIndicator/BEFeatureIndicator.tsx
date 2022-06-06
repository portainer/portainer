import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { FeatureId } from '@/portainer/feature-flags/enums';

import { getFeatureDetails } from './utils';

export interface Props {
  featureId?: FeatureId;
  showIcon?: boolean;
  className?: string;
}

export function BEFeatureIndicator({
  featureId,
  children,
  showIcon = true,
  className = '',
}: PropsWithChildren<Props>) {
  const { url, limitedToBE } = getFeatureDetails(featureId);

  if (!limitedToBE) {
    return null;
  }

  return (
    <a
      className={clsx('be-indicator', className)}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      {showIcon && (
        <i className="fas fa-briefcase space-right be-indicator-icon" />
      )}
      <span className="be-indicator-label break-words">
        Business Edition Feature
      </span>
    </a>
  );
}
