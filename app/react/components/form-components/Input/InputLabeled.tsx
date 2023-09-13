import { ComponentProps, InputHTMLAttributes } from 'react';

import { InputGroup } from '../InputGroup';

export function InputLabeled({
  label,
  className,
  size,
  id,
  ...props
}: {
  label: string;
  className?: string;
  size?: ComponentProps<typeof InputGroup>['size'];
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'children'>) {
  return (
    <InputGroup className={className} size={size}>
      <InputGroup.Addon as="label" htmlFor={id}>
        {label}
      </InputGroup.Addon>
      <InputGroup.Input
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        id={id}
      />
    </InputGroup>
  );
}
