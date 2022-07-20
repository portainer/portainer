import { ReactNode } from 'react';
import clsx from 'clsx';

import { Icon, IconProps } from '@/react/components/Icon';
import { pluralize } from '@/portainer/helpers/strings';

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
    <div
      className={clsx(
        'border-solid rounded-lg border-2 hover:border-2 border-gray-5 hover:border-blue-7',
        'bg-gray-2 hover:bg-blue-2',
        'p-3'
      )}
    >
      <div className="flex items-center" aria-label={type}>
        <div className="icon-badge text-2xl bg-blue-3 text-blue-8 mr-4">
          <Icon icon={icon} feather={featherIcon} className="feather" />
        </div>

        <div className="flex flex-col justify-around">
          <div className="text-gray-9 font-medium text-2xl" aria-label="value">
            {typeof value !== 'undefined' ? value : '-'}
          </div>
          <div className="text-gray-7 text-xl" aria-label="resourceType">
            {pluralize(value || 0, type)}
          </div>
        </div>

        <div className="ml-auto">{children}</div>
      </div>
    </div>
  );
}
