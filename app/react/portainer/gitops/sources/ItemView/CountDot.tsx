import clsx from 'clsx';

import { addPlural } from '@/react/common/string-utils';

export function CountDot({
  value = 0,
  type,
}: {
  value: number | undefined;
  type: string;
}) {
  return (
    <span
      className={clsx([
        'inline-block shrink-0 rounded-full',
        'shadow-[0_0_8px_var(--tw-shadow-color)]',
        'flex h-5 w-5 items-center justify-center text-xs font-bold',
        'bg-blue-2 text-blue-6',
        'th-dark:bg-gray-7 th-dark:text-white',
        'th-highcontrast:bg-gray-7 th-highcontrast:text-white',
      ])}
      role="status"
      aria-label={addPlural(value, type)}
    >
      {value}
    </span>
  );
}
