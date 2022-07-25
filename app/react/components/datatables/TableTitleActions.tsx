import { PropsWithChildren } from 'react';

import { useTableContext } from './TableContainer';

export function TableTitleActions({ children }: PropsWithChildren<unknown>) {
  useTableContext();

  return <div className="settings">{children}</div>;
}
