import clsx from 'clsx';
import { PropsWithChildren } from 'react';

type BadgeType = 'success' | 'danger' | 'warn' | 'info';

export interface Props {
  type?: BadgeType;
  className?: string;
}

// this component is used in tables and lists in portainer. It looks like this:
// https://www.figma.com/file/g5TUMngrblkXM7NHSyQsD1/New-UI?node-id=76%3A2
export function Badge({ type, className, children }: PropsWithChildren<Props>) {
  const baseClasses =
    'flex w-fit items-center !text-xs font-medium rounded-full px-2 py-0.5';
  const typeClasses = getClasses(type);

  return (
    <span className={clsx(baseClasses, typeClasses, className)}>
      {children}
    </span>
  );
}

// classes in full to prevent a dev server bug, where tailwind doesn't render the interpolated classes
function getClasses(type: BadgeType | undefined) {
  switch (type) {
    case 'success':
      return clsx(
        `text-success-9 bg-success-2`,
        `th-dark:text-success-3 th-dark:bg-success-10`,
        `th-highcontrast:text-success-3 th-highcontrast:bg-success-10`
      );
    case 'warn':
      return clsx(
        `text-warning-9 bg-warning-2`,
        `th-dark:text-warning-3 th-dark:bg-warning-10`,
        `th-highcontrast:text-warning-3 th-highcontrast:bg-warning-10`
      );
    case 'danger':
      return clsx(
        `text-error-9 bg-error-2`,
        `th-dark:text-error-3 th-dark:bg-error-10`,
        `th-highcontrast:text-error-3 th-highcontrast:bg-error-10`
      );
    case 'info':
      return clsx(
        `text-blue-9 bg-blue-2`,
        `th-dark:text-blue-3 th-dark:bg-blue-10`,
        `th-highcontrast:text-blue-3 th-highcontrast:bg-blue-10`
      );
    default:
      return clsx(
        `text-blue-9 bg-blue-2`,
        `th-dark:text-blue-3 th-dark:bg-blue-10`,
        `th-highcontrast:text-blue-3 th-highcontrast:bg-blue-10`
      );
  }
}
