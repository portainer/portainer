import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Briefcase } from 'lucide-react';

import './BEFeatureIndicator.css';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Icon } from '@@/Icon';

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
      className={clsx('be-indicator vertical-center text-xs', className)}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      {showIcon && <Icon icon={Briefcase} className="be-indicator-icon mr-1" />}
      <span className="be-indicator-label break-words">Business Feature</span>
    </a>
  );
}
