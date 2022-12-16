import { ReactNode } from 'react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

interface Props {
  featureId: FeatureId;
  heading: string;
  message: string;
  buttonText: string;
  className?: string;
  icon?: ReactNode;
}

export function BEOnlyButton({
  featureId,
  heading,
  message,
  buttonText,
  className,
  icon,
}: Props) {
  return (
    <TooltipWithChildren
      className={className}
      heading={heading}
      BEFeatureID={featureId}
      message={message}
    >
      <Button
        icon={icon}
        type="button"
        color="warninglight"
        size="small"
        onClick={() => {}}
        disabled
      >
        {buttonText}
      </Button>
    </TooltipWithChildren>
  );
}
