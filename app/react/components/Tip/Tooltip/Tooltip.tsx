import { HelpCircle } from 'lucide-react';

import { TooltipWithChildren } from '../TooltipWithChildren';

type Position = 'top' | 'right' | 'bottom' | 'left';

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
      <HelpCircle className="feather ml-1" aria-hidden="true" />
    </TooltipWithChildren>
  );
}
