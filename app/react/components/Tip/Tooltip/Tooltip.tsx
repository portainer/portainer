import { HelpCircle } from 'lucide-react';

import { TooltipWithChildren, Position } from '../TooltipWithChildren';

export interface Props {
  position?: Position;
  message: string;
  className?: string;
}

export function Tooltip({ message, position = 'bottom', className }: Props) {
  return (
    <TooltipWithChildren
      message={message}
      position={position}
      className={className}
    >
      <span className="inline-flex text-base">
        <HelpCircle className="lucide ml-1" aria-hidden="true" />
      </span>
    </TooltipWithChildren>
  );
}
