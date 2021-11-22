import clsx from 'clsx';
import { HTMLInputTypeAttribute } from 'react';

import { BaseInput } from './BaseInput';
import { ChangeProps, InputProps } from './types';

interface TextInputProps extends InputProps, ChangeProps<string> {
  type?: HTMLInputTypeAttribute;
  readonly?: boolean;
}

export function TextInput({
  id,
  type = 'text',
  value,
  className,
  onChange,
  disabled,
  readonly,
  required,
  placeholder,
}: TextInputProps) {
  return (
    <BaseInput
      id={id}
      type={type}
      className={clsx(className, 'form-control')}
      value={value}
      onChange={onChange}
      disabled={disabled}
      readonly={readonly}
      required={required}
      placeholder={placeholder}
    />
  );
}
