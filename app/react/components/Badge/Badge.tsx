import clsx from 'clsx';
import { PropsWithChildren } from 'react';

export type BadgeType =
  | 'success'
  | 'danger'
  | 'warn'
  | 'info'
  | 'successSecondary'
  | 'dangerSecondary'
  | 'warnSecondary'
  | 'infoSecondary';

// the classes are typed in full because tailwind doesn't render the interpolated classes
const typeClasses: Record<BadgeType, string> = {
  success: clsx(
    'text-success-9 bg-success-2',
    'th-dark:text-success-3 th-dark:bg-success-10',
    'th-highcontrast:text-success-3 th-highcontrast:bg-success-10'
  ),
  warn: clsx(
    'text-warning-9 bg-warning-2',
    'th-dark:text-warning-3 th-dark:bg-warning-10',
    'th-highcontrast:text-warning-3 th-highcontrast:bg-warning-10'
  ),
  danger: clsx(
    'text-error-9 bg-error-2',
    'th-dark:text-error-3 th-dark:bg-error-10',
    'th-highcontrast:text-error-3 th-highcontrast:bg-error-10'
  ),
  info: clsx(
    'text-blue-9 bg-blue-2',
    'th-dark:text-blue-3 th-dark:bg-blue-10',
    'th-highcontrast:text-blue-3 th-highcontrast:bg-blue-10'
  ),
  // the secondary classes are a bit darker in light mode and a bit lighter in dark mode
  successSecondary: clsx(
    'text-success-9 bg-success-3',
    'th-dark:text-success-3 th-dark:bg-success-9',
    'th-highcontrast:text-success-3 th-highcontrast:bg-success-9'
  ),
  warnSecondary: clsx(
    'text-warning-9 bg-warning-3',
    'th-dark:text-warning-3 th-dark:bg-warning-9',
    'th-highcontrast:text-warning-3 th-highcontrast:bg-warning-9'
  ),
  dangerSecondary: clsx(
    'text-error-9 bg-error-3',
    'th-dark:text-error-3 th-dark:bg-error-9',
    'th-highcontrast:text-error-3 th-highcontrast:bg-error-9'
  ),
  infoSecondary: clsx(
    'text-blue-9 bg-blue-3',
    'th-dark:text-blue-3 th-dark:bg-blue-9',
    'th-highcontrast:text-blue-3 th-highcontrast:bg-blue-9'
  ),
};

export interface Props {
  type?: BadgeType;
  className?: string;
}

// this component is used in tables and lists in portainer. It looks like this:
// https://www.figma.com/file/g5TUMngrblkXM7NHSyQsD1/New-UI?node-id=76%3A2
export function Badge({
  type = 'info',
  className,
  children,
}: PropsWithChildren<Props>) {
  const baseClasses =
    'inline-flex w-fit items-center !text-xs font-medium rounded-full px-2 py-0.5';

  return (
    <span
      className={clsx(baseClasses, typeClasses[type], className)}
      role="status"
    >
      {children}
    </span>
  );
}
