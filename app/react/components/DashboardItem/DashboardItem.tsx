import { ReactNode } from 'react';
import clsx from 'clsx';

import { Icon, IconProps } from '@/react/components/Icon';
import { pluralize } from '@/portainer/helpers/strings';

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
    <Widget>
      <WidgetBody
        className={clsx(
          'border-solid rounded-lg border hover:border-2 hover:-m-px border-gray-5 hover:border-blue-7',
          'bg-gray-2 hover:bg-blue-2'
        )}
      >
        <div className="flex" aria-label={type}>
          <div className="widget-icon blue">
            <Icon icon={icon} feather={featherIcon} />
          </div>

          <div className="flex flex-col justify-around">
            <div className="text-gray-9 font-medium text-xl" aria-label="value">
              {typeof value !== 'undefined' ? value : '-'}
            </div>
            <div className="text-gray-7 text-lg" aria-label="resourceType">
              {pluralize(value || 0, type)}
            </div>
          </div>

          <div className="ml-auto">{children}</div>
        </div>
      </WidgetBody>
    </Widget>
  );
}
