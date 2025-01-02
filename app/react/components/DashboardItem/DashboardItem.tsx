import { ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

import { Icon, IconProps } from '@/react/components/Icon';
import { pluralize } from '@/portainer/helpers/strings';
import { AutomationTestingProps } from '@/types';

import { Link } from '@@/Link';

interface Props extends IconProps, AutomationTestingProps {
  type: string;
  pluralType?: string; // in case the pluralise function isn't suitable
  isLoading?: boolean;
  isRefetching?: boolean;
  value?: number;
  to?: string;
  params?: object;
  children?: ReactNode;
}

export function DashboardItem({
  icon,
  type,
  pluralType,
  isLoading,
  isRefetching,
  value,
  to,
  params,
  children,
  'data-cy': dataCy,
}: Props) {
  const Item = (
    <div
      className={clsx(
        'relative rounded-lg border border-solid p-3',
        'border-gray-5 bg-gray-2 hover:border-blue-7 hover:bg-blue-2',
        'th-dark:border-gray-neutral-8 th-dark:bg-gray-iron-10 th-dark:hover:border-blue-8 th-dark:hover:bg-gray-10',
        'th-highcontrast:border-white th-highcontrast:bg-black th-highcontrast:hover:border-blue-8 th-highcontrast:hover:bg-gray-11'
      )}
      data-cy={dataCy}
    >
      <div
        className={clsx(
          'text-muted absolute right-2 top-2 flex items-center text-xs transition-opacity',
          isRefetching ? 'opacity-100' : 'opacity-0'
        )}
      >
        Refreshing total
        <Loader2 className="h-4 animate-spin-slow" />
      </div>
      <div
        className={clsx(
          'text-muted absolute right-2 top-2 flex items-center text-xs transition-opacity',
          isLoading ? 'opacity-100' : 'opacity-0'
        )}
      >
        Loading total
        <Loader2 className="h-4 animate-spin-slow" />
      </div>
      <div className="flex items-center" aria-label={type}>
        <div
          className={clsx(
            'icon-badge mr-4 !p-2 text-2xl',
            'bg-blue-3 text-blue-8',
            'th-dark:bg-blue-3 th-dark:text-blue-8',
            'th-highcontrast:bg-blue-3 th-highcontrast:text-blue-8'
          )}
        >
          <Icon icon={icon} />
        </div>

        <div className="flex flex-col justify-around">
          <div
            className={clsx(
              'text-2xl font-medium',
              'text-gray-9',
              'th-dark:text-white',
              'th-highcontrast:text-white'
            )}
            aria-label="value"
          >
            {typeof value === 'undefined' ? '-' : value}
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
            {pluralize(value || 0, type, pluralType)}
          </div>
        </div>

        <div className="ml-auto">{children}</div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="!no-underline"
        params={params}
        data-cy={`${dataCy}-link`}
      >
        {Item}
      </Link>
    );
  }
  return Item;
}
