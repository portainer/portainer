import { PropsWithChildren } from 'react';

import { useTableContext } from './TableContainer';

export function TableActions({ children }: PropsWithChildren<unknown>) {
  useTableContext();

  return <div className="actionBar">{children}</div>;
}
