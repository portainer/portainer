import clsx from 'clsx';

import { BaseInput } from './BaseInput';
import { InputProps } from './types';

interface Props extends InputProps {
  value: number;
  readonly?: boolean;
  onChange(value: number): void;
}

export function NumberInput({
  disabled,
  required,
  id,
  value,
  className,
  readonly,
  onChange,
}: Props) {
  return (
    <BaseInput
      id={id}
      type="number"
      className={clsx(className, 'form-control')}
      value={value}
      disabled={disabled}
      readonly={readonly}
      required={required}
      onChange={(value) => onChange(parseFloat(value))}
    />
  );
}
