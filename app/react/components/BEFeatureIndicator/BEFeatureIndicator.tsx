import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Briefcase } from 'react-feather';

import './BEFeatureIndicator.css';

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
      className={clsx('be-indicator vertical-center', className)}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      {showIcon && <Briefcase className="icon icon-sm vertical-center" />}
      <span className="be-indicator-label break-words space-left">
        Business Edition Feature
      </span>
    </a>
  );
}
