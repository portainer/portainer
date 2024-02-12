import { HelpCircle } from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import sanitize from 'sanitize-html';
import clsx from 'clsx';

import { TooltipWithChildren, Position } from '../TooltipWithChildren';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export interface Props {
  position?: Position;
  message: ReactNode;
  className?: string;
  setHtmlMessage?: boolean;
  size?: Size;
}

export function Tooltip({
  message,
  position = 'bottom',
  className,
  setHtmlMessage,
  size = 'md',
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
    <span className={clsx('ml-1 inline-flex items-center', sizeClasses[size])}>
      <TooltipWithChildren
        message={htmlMessage || message}
        position={position}
        className={className}
      >
        <HelpCircle className="lucide" aria-hidden="true" />
      </TooltipWithChildren>
    </span>
  );
}
