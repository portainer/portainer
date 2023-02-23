import { HelpCircle } from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import sanitize from 'sanitize-html';

import { TooltipWithChildren, Position } from '../TooltipWithChildren';

export interface Props {
  position?: Position;
  message: ReactNode;
  className?: string;
  setHtmlMessage?: boolean;
}

export function Tooltip({
  message,
  position = 'bottom',
  className,
  setHtmlMessage,
}: Props) {
  // allow angular views to set html messages for the tooltip
  const htmlMessage = useMemo(() => {
    if (setHtmlMessage && typeof message === 'string') {
      // eslint-disable-next-line react/no-danger
      return <div dangerouslySetInnerHTML={{ __html: sanitize(message) }} />;
    }
    return null;
  }, [setHtmlMessage, message]);

  return (
    <TooltipWithChildren
      message={htmlMessage || message}
      position={position}
      className={className}
    >
      <span className="inline-flex text-base">
        <HelpCircle className="lucide ml-1" aria-hidden="true" />
      </span>
    </TooltipWithChildren>
  );
}
