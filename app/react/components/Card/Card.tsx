import clsx from 'clsx';
import { PropsWithChildren } from 'react';

export interface Props {
  className?: string;
}

export function Card({ className, children }: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        className,
        'rounded border border-solid border-gray-5 bg-gray-neutral-3 p-5 th-highcontrast:border-white th-highcontrast:bg-black th-dark:border-legacy-grey-3 th-dark:bg-gray-iron-11'
      )}
    >
      {children}
    </div>
  );
}
