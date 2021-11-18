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
}: TextInputProps) {
  return (
    <BaseInput
      id={id}
      type={type}
      className={className}
      value={value}
      onChange={onChange}
      disabled={disabled}
      readonly={readonly}
      required={required}
    />
  );
}
