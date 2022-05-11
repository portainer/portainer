import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { useWidgetContext } from './Widget';

export const rdWidgetTitle = {
  requires: '^rdWidget',
  bindings: {
    titleText: '@',
    icon: '@',
    classes: '@?',
  },
  transclude: {
    title: '?headerTitle',
  },
  template: `
    <div class="widget-header">
      <div class="row">
        <span ng-class="$ctrl.classes" class="pull-left">
          <i class="fa" ng-class="$ctrl.icon"></i>
          <span ng-transclude="title">{{ $ctrl.titleText }}</span>
        </span>
        <span ng-class="$ctrl.classes" class="pull-right" ng-transclude></span>
      </div>
    </div>
`,
};

interface Props {
  title: ReactNode;
  icon: ReactNode;
  className?: string;
}

export function WidgetTitle({
  title,
  icon,
  className,
  children,
}: PropsWithChildren<Props>) {
  useWidgetContext();

  return (
    <div className="widget-header">
      <div className="row">
        <span className={clsx('pull-left', className)}>
          {typeof icon === 'string' ? <i className={clsx('fa', icon)} /> : icon}
          <span>{title}</span>
        </span>
        <span className={clsx('pull-right', className)}>{children}</span>
      </div>
    </div>
  );
}
