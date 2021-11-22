import clsx from 'clsx';
import { HTMLInputTypeAttribute } from 'react';

import { InputProps } from './types';

interface Props extends InputProps {
  type?: HTMLInputTypeAttribute;
  onChange(value: string): void;
  value: number | string;
  component?: 'input' | 'textarea';
  rows?: number;
  readonly?: boolean;
}

export function BaseInput({
  component = 'input',
  value,
  disabled,
  id,
  readonly,
  required,
  type,
  className,
  rows,
  onChange,
}: Props) {
  const Component = component;
  return (
    <Component
      value={value}
      disabled={disabled}
      id={id}
      readOnly={readonly}
      required={required}
      type={type}
      className={clsx(className, 'form-control')}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
    />
  );
}
