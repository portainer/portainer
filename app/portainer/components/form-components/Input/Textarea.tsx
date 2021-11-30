import { BaseInput } from './BaseInput';
import { ChangeProps, InputProps } from './types';

interface Props extends InputProps, ChangeProps<string> {
  rows?: number;
}

export function Textarea({
  rows,
  className,
  onChange,
  value,
  id,
  placeholder,
  disabled,
  required,
}: Props & InputProps) {
  return (
    <BaseInput
      component="textarea"
      id={id}
      rows={rows}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
    />
  );
}
