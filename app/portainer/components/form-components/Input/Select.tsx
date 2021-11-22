import clsx from 'clsx';
import { FormEvent } from 'react';

import { ChangeProps, InputProps } from './types';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> extends InputProps, ChangeProps<T> {
  options: Option<T>[];
}

export function Select<T extends number | string>({
  options,
  onChange,
  value,
  className,
  disabled,
  id,
  required,
}: Props<T>) {
  return (
    <select
      value={value}
      disabled={disabled}
      id={id}
      required={required}
      className={clsx(className, 'form-control')}
      onChange={handleChange}
    >
      {options.map((item) => (
        <option value={item.value}>{item.label}</option>
      ))}
    </select>
  );

  function handleChange(e: FormEvent<HTMLSelectElement>) {
    const { selectedIndex } = e.currentTarget;
    const option = options[selectedIndex];
    onChange(option.value);
  }
}
