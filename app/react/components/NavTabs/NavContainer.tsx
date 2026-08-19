import clsx from 'clsx';
import { PropsWithChildren } from 'react';

export function NavContainer({ children }: PropsWithChildren<unknown>) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-solid p-2',
        'border-gray-5 bg-gray-2',
        'th-dark:border-gray-neutral-8 th-dark:bg-gray-iron-10',
        'th-highcontrast:border-white th-highcontrast:bg-black'
      )}
    >
      {children}
    </div>
  );
}
