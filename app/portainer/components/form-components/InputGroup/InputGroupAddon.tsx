import { PropsWithChildren } from 'react';

import { useInputGroupContext } from './InputGroup';

export function InputGroupAddon({ children }: PropsWithChildren<unknown>) {
  useInputGroupContext();

  return <span className="input-group-addon">{children}</span>;
}
