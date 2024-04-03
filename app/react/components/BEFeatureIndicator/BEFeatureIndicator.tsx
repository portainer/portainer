import { ReactNode } from 'react';
import clsx from 'clsx';
import { Briefcase } from 'lucide-react';

import './BEFeatureIndicator.css';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Icon } from '@@/Icon';

import { getFeatureDetails } from './utils';

export interface Props {
  featureId: FeatureId;
  showIcon?: boolean;
  className?: string;
  children?: (isLimited: boolean) => ReactNode;
}

export function BEFeatureIndicator({
  featureId,
  children = () => null,
  showIcon = true,
  className = '',
}: Props) {
  const { url, limitedToBE = false } = getFeatureDetails(featureId);

  return (
    <>
      {limitedToBE && (
        <a
          className={clsx('be-indicator vertical-center text-xs', className)}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {showIcon && (
            <Icon icon={Briefcase} className="be-indicator-icon mr-1" />
          )}
          <span className="be-indicator-label break-words">
            Business Feature
          </span>
        </a>
      )}

      {children(limitedToBE)}
    </>
  );
}
