import { PropsWithChildren } from 'react';

import './NestedTable.css';

export function NestedTable({ children }: PropsWithChildren<unknown>) {
  return <div className="inner-datatable">{children}</div>;
}
