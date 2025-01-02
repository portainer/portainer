import clsx from 'clsx';
import { AriaAttributes, PropsWithChildren } from 'react';

import { Icon, IconProps } from '@@/Icon';

export function StatusBadge({
  className,
  children,
  color = 'default',
  icon,
  ...aria
}: PropsWithChildren<
  {
    className?: string;
    color?: 'success' | 'danger' | 'warning' | 'info' | 'default';
    icon?: IconProps['icon'];
  } & AriaAttributes
>) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded',
        'w-fit px-1.5 py-0.5',
        'text-sm font-medium text-white',
        {
          'bg-success-7 th-dark:bg-success-9': color === 'success',
          'bg-warning-7 th-dark:bg-warning-9': color === 'warning',
          'bg-error-7 th-dark:bg-error-9': color === 'danger',
          'bg-blue-9': color === 'info',
        },
        className
      )}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...aria}
    >
      {icon && (
        <Icon
          icon={icon}
          className={clsx({
            '!text-green-7': color === 'success',
            '!text-warning-7': color === 'warning',
            '!text-error-7': color === 'danger',
          })}
        />
      )}

      {children}
    </span>
  );
}
