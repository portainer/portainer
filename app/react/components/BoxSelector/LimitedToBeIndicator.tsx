import ReactTooltip from 'react-tooltip';
import { HelpCircle } from 'react-feather';

import { FeatureId } from '@/portainer/feature-flags/enums';

import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

interface Props {
  tooltipId: string;
  featureId?: FeatureId;
}

export function LimitedToBeIndicator({ tooltipId, featureId }: Props) {
  const { url } = getFeatureDetails(featureId);

  return (
    <>
      <div className="absolute left-0 top-0 w-full">
        <div className="mx-auto max-w-fit bg-warning-4 rounded-b-lg py-1 px-3 flex gap-1 text-sm items-center">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <span className="text-warning-9">Pro Feature</span>
          </a>
          <HelpCircle
            className="feather !text-warning-7"
            data-tip
            data-for={tooltipId}
            tooltip-append-to-body="true"
            tooltip-placement="top"
            tooltip-class="portainer-tooltip"
          />
        </div>
      </div>
      <ReactTooltip
        className="portainer-tooltip"
        id={tooltipId}
        place="top"
        delayHide={1000}
      >
        Business Edition feature. <br />
        This feature is currently limited to Business Edition users only.
      </ReactTooltip>
    </>
  );
}
