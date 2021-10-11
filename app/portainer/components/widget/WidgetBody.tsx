import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useWidgetContext } from './Widget';
import { Loading } from './Loading';

export const rdWidgetBody = {
  requires: '^rdWidget',
  bindings: {
    loading: '@?',
    classes: '@?',
  },
  transclude: true,
  template: `
    <div class="widget-body" ng-class="$ctrl.classes">
      <rd-loading ng-show="$ctrl.loading"></rd-loading>
      <div ng-hide="$ctrl.loading" class="widget-content" ng-transclude></div>
    </div>
  `,
};

interface Props {
  loading?: boolean;
  className?: string;
}

export function WidgetBody({
  loading,
  className,
  children,
}: PropsWithChildren<Props>) {
  useWidgetContext();

  return (
    <div className={clsx(className, 'widget-body')}>
      {loading ? <Loading /> : <div className="widget-content">{children}</div>}
    </div>
  );
}
