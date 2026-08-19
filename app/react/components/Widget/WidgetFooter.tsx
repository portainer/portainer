import { PropsWithChildren } from 'react';

import { useWidgetContext } from './Widget';

export function WidgetFooter({ children }: PropsWithChildren<unknown>) {
  useWidgetContext();

  return <div className="widget-footer">{children}</div>;
}
