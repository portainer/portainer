import { PropsWithChildren } from 'react';

import { useWidgetContext } from './Widget';

export const rdWidgetFooter = {
  requires: '^rdWidget',
  transclude: true,
  template: `
    <div class="widget-footer" ng-transclude></div>
  `,
};

export function WidgetFooter({ children }: PropsWithChildren<unknown>) {
  useWidgetContext();

  return <div className="widget-footer">{children}</div>;
}
