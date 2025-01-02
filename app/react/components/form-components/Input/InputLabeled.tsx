import { ComponentProps, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { InputGroup } from '../InputGroup';

export function InputLabeled({
  label,
  className,
  size,
  needsDeletion,
  id,
  required,
  disabled,
  ...props
}: {
  label: string;
  className?: string;
  size?: ComponentProps<typeof InputGroup>['size'];
  needsDeletion?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'children'> &
  AutomationTestingProps) {
  return (
    <InputGroup
      className={clsx(className, needsDeletion && 'striked')}
      size={size}
    >
      <InputGroup.Addon as="label" htmlFor={id} required={required}>
        {label}
      </InputGroup.Addon>
      <InputGroup.Input
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        disabled={disabled || needsDeletion}
        id={id}
      />
    </InputGroup>
  );
}
