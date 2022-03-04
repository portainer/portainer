import { PropsWithChildren } from 'react';

import { useInputGroupContext } from './InputGroup';

export function InputGroupButtonWrapper({
  children,
}: PropsWithChildren<unknown>) {
  useInputGroupContext();

  return <span className="input-group-btn">{children}</span>;
}
