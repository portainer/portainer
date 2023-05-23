import { ComponentType, PropsWithChildren } from 'react';
import clsx from 'clsx';

import { useInputGroupContext } from './InputGroup';

type BaseProps<TProps> = {
  as?: ComponentType<TProps> | string;
  required?: boolean;
};

export function InputGroupAddon<TProps>({
  children,
  as = 'span',
  required,
  ...props
}: PropsWithChildren<BaseProps<TProps> & TProps>) {
  useInputGroupContext();
  const Component = as as 'span';

  return (
    <Component
      className={clsx('input-group-addon', required && 'required')}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {children}
    </Component>
  );
}
