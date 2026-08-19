import { PropsWithChildren } from 'react';

import { useWidgetContext } from './Widget';

interface Props {
  className?: string;
}

export function WidgetTaskbar({
  children,
  className,
}: PropsWithChildren<Props>) {
  useWidgetContext();

  return (
    <div className="widget-header">
      <div className="row">
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
