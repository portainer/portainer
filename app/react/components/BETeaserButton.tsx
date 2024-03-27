import { Briefcase } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { AutomationTestingProps } from '@/types';

import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

interface Props extends AutomationTestingProps {
  featureId: FeatureId;
  heading: string;
  message: string;
  buttonText: string;
  className?: string;
  buttonClassName?: string;
}

export function BETeaserButton({
  featureId,
  heading,
  message,
  buttonText,
  className,
  buttonClassName,
  'data-cy': dataCy,
}: Props) {
  return (
    <TooltipWithChildren
      className={className}
      heading={heading}
      BEFeatureID={featureId}
      message={message}
    >
      <span>
        <Button
          className={buttonClassName}
          icon={Briefcase}
          type="button"
          color="default"
          size="small"
          onClick={() => {}}
          disabled
          data-cy={dataCy}
        >
          {buttonText}
        </Button>
      </span>
    </TooltipWithChildren>
  );
}
