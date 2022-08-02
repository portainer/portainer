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
        'border-solid rounded-lg border p-3',
        'bg-gray-2 hover:bg-blue-2 border-gray-5 hover:border-blue-7',
        'th-dark:bg-gray-iron-10 th-dark:hover:bg-gray-10 th-dark:border-gray-neutral-8 th-dark:hover:border-blue-8',
        'th-highcontrast:bg-black th-highcontrast:hover:bg-gray-11 th-highcontrast:border-white th-highcontrast:hover:border-blue-8'
      )}
    >
      <div className="flex items-center" aria-label={type}>
        <div
          className={clsx(
            'icon-badge text-2xl mr-4 !p-2',
            'bg-blue-3 text-blue-8',
            'th-dark:bg-blue-3 th-dark:text-blue-8',
            'th-highcontrast:bg-blue-3 th-highcontrast:text-blue-8'
          )}
        >
          <Icon icon={icon} feather={featherIcon} className="feather" />
        </div>

        <div className="flex flex-col justify-around">
          <div
            className={clsx(
              'font-medium text-2xl',
              'text-gray-9',
              'th-dark:text-white',
              'th-highcontrast:text-white'
            )}
            aria-label="value"
          >
            {typeof value !== 'undefined' ? value : '-'}
          </div>
          <div
            className={clsx(
              'text-xl',
              'text-gray-7',
              'th-dark:text-gray-warm-5',
              'th-highcontrast:text-gray-warm-5'
            )}
            aria-label="resourceType"
          >
            {pluralize(value || 0, type)}
          </div>
        </div>

        <div className="ml-auto">{children}</div>
      </div>
    </div>
  );
}
