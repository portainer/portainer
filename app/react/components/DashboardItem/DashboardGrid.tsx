import { PropsWithChildren } from 'react';

import './DashboardGrid.css';

export function DashboardGrid({ children }: PropsWithChildren<unknown>) {
  return <div className="dashboard-grid">{children}</div>;
}
