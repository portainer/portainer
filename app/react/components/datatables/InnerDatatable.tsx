import { PropsWithChildren } from 'react';

import './InnerDatatable.css';

export function InnerDatatable({ children }: PropsWithChildren<unknown>) {
  return <div className="inner-datatable">{children}</div>;
}
