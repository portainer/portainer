import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

interface Props {
  tooltipId: string;
  featureId?: FeatureId;
}

export function LimitedToBeIndicator({ featureId, tooltipId }: Props) {
  const { url } = getFeatureDetails(featureId);

  return (
    <div className="absolute left-0 top-0 w-full">
      <div className="mx-auto flex max-w-fit items-center gap-1 rounded-b-lg bg-warning-4 py-1 px-3 text-sm">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <span className="text-warning-9">BE Feature</span>
        </a>
        <TooltipWithChildren
          position="bottom"
          className={clsx(tooltipId, 'portainer-tooltip')}
          heading="Business Edition feature."
          message="This feature is currently limited to Business Edition users only."
        >
          <HelpCircle className="ml-1 !text-warning-7" aria-hidden="true" />
        </TooltipWithChildren>
      </div>
    </div>
  );
}
