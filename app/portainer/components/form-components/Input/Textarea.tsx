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
}: Props & InputProps) {
  return (
    <BaseInput
      component="textarea"
      id={id}
      rows={rows}
      className={className}
      value={value}
      onChange={onChange}
    />
  );
}
