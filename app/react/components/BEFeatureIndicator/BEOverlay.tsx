import clsx from 'clsx';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { BEFeatureIndicator } from './BEFeatureIndicator';

export function BEOverlay({
  featureId,
  children,
  className,
}: {
  featureId: FeatureId;
  children: React.ReactNode;
  className?: string;
}) {
  const isLimited = isLimitedToBE(featureId);
  if (!isLimited) {
    return <>{children}</>;
  }

  return (
    <div className="be-indicator-container limited-be">
      <div className="limited-be-link vertical-center">
        <BEFeatureIndicator featureId={featureId} />
      </div>
      <div className={clsx('limited-be-content', className)}>{children}</div>
    </div>
  );
}
