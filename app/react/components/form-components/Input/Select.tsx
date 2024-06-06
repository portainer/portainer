import clsx from 'clsx';
import { SelectHTMLAttributes } from 'react';

import { AutomationTestingProps } from '@/types';

export interface Option<T extends string | number>
  extends Partial<AutomationTestingProps> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string | number> extends AutomationTestingProps {
  options: Array<Option<T>> | ReadonlyArray<Option<T>>;
}

export function Select<T extends number | string>({
  options,
  className,
  'data-cy': dataCy,
  ...props
}: Props<T> & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx('form-control', className)}
      data-cy={dataCy}
    >
      {options.map((item) => (
        <option
          value={item.value}
          key={item.value}
          disabled={item.disabled}
          data-cy={`${dataCy}-${item.value}`}
        >
          {item.label}
        </option>
      ))}
    </select>
  );
}
