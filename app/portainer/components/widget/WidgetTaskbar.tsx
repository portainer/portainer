import { PropsWithChildren } from 'react';

import { useWidgetContext } from './Widget';

export const rdWidgetTaskbar = {
  requires: '^rdWidget',
  bindings: {
    classes: '@?',
  },
  transclude: true,
  template: `
    <div class="widget-header">
      <div class="row">
        <div ng-class="$ctrl.classes" ng-transclude></div>
      </div>
    </div>
  `,
};

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
