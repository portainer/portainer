import { PropsWithChildren } from 'react';

import { useTableContext } from './TableContainer';

export function TableFooter({ children }: PropsWithChildren<unknown>) {
  useTableContext();

  return <footer className="footer">{children}</footer>;
}
