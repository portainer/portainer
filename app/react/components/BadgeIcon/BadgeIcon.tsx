import clsx from 'clsx';

import { Icon, IconProps } from '@@/Icon';

export type BadgeSize = 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface Props extends IconProps {
  size?: BadgeSize;
}

export function BadgeIcon({ icon, size = '3xl', iconClass }: Props) {
  const sizeClasses = iconSizeToClasses(size);
  return (
    <div
      className={clsx(
        sizeClasses,
        `badge-icon
      inline-flex items-center
      justify-center rounded-full
      bg-blue-3
      text-blue-8 th-dark:bg-gray-9 th-dark:text-blue-3
   `
      )}
    >
      <Icon icon={icon} className={clsx('!flex', iconClass)} />
    </div>
  );
}

function iconSizeToClasses(size: BadgeSize) {
  switch (size) {
    case 'md':
      return 'h-6 w-6 text-md';
    case 'lg':
      return 'h-8 w-8 text-lg';
    case 'xl':
      return 'h-10 w-10 text-xl';
    case '2xl':
      return 'h-12 w-12 text-2xl';
    case '3xl':
      return 'h-14 w-14 text-3xl';
    default:
      return 'h-14 w-14 text-3xl';
  }
}
