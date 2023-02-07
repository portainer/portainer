import { ComponentType, PropsWithChildren } from 'react';

import { useInputGroupContext } from './InputGroup';

export function InputGroupAddon<TProps>({
  children,
  as = 'span',
  ...props
}: PropsWithChildren<{ as?: ComponentType<TProps> | string } & TProps>) {
  useInputGroupContext();
  const Component = as as 'span';

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Component className="input-group-addon" {...props}>
      {children}
    </Component>
  );
}
