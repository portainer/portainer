import { ReactNode } from 'react';

import { Icon, IconProps } from '@/react/components/Icon';

import { Widget, WidgetBody } from '@@/Widget';

interface Props extends IconProps {
  value?: number;
  type: string;
  children?: ReactNode;
}

export function DashboardItem({
  value,
  icon,
  type,
  children,
  featherIcon,
}: Props) {
  return (
    <div className="col-sm-12 col-md-6" aria-label={type}>
      <Widget>
        <WidgetBody>
          <div className="widget-icon blue pull-left">
            <Icon icon={icon} feather={featherIcon} />
          </div>
          <div className="pull-right">{children}</div>
          <div className="title" aria-label="value">
            {value}
          </div>
          <div className="comment" aria-label="resourceType">
            {type}
          </div>
        </WidgetBody>
      </Widget>
    </div>
  );
}
