import clsx from 'clsx';
import { AriaAttributes, PropsWithChildren } from 'react';

import { Icon, IconProps } from '@@/Icon';

export function EnvironmentStatusBadgeItem({
  className,
  children,
  color = 'default',
  icon,
  ...aria
}: PropsWithChildren<
  {
    className?: string;
    color?: 'success' | 'danger' | 'default';
    icon?: IconProps['icon'];
  } & AriaAttributes
>) {
  return (
    <span
      className={clsx(
        'flex items-center gap-1',
        'rounded border-2 border-solid',
        'w-fit py-px px-1',
        'text-xs font-semibold text-gray-7',
        {
          'border-green-3 bg-green-2': color === 'success',
          'border-error-3 bg-error-2': color === 'danger',
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
            '!text-error-7': color === 'danger',
          })}
        />
      )}

      {children}
    </span>
  );
}
