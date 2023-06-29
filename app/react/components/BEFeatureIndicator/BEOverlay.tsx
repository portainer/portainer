import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Tooltip } from '@@/Tip/Tooltip';

import { BEFeatureIndicator } from '.';

export function BEOverlay({
  featureId,
  children,
}: {
  featureId: FeatureId;
  children: React.ReactNode;
}) {
  const isLimited = isLimitedToBE(featureId);
  if (!isLimited) {
    return <>{children}</>;
  }

  return (
    <div className="be-indicator-container limited-be">
      <div className="overlay">
        <div className="limited-be-link vertical-center">
          <BEFeatureIndicator featureId={FeatureId.CA_FILE} />
          <Tooltip message="This feature is currently limited to Business Edition users only. " />
        </div>
        <div className="limited-be-content">{children}</div>
      </div>
    </div>
  );
}
