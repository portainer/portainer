import clsx from 'clsx';
import { SelectHTMLAttributes } from 'react';

export interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  options: Option<T>[];
}

export function Select<T extends number | string>({
  options,
  className,
  ...props
}: Props<T> & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx('form-control', className)}
    >
      {options.map((item) => (
        <option value={item.value} key={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
