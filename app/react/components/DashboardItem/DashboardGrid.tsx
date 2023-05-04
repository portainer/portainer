import { PropsWithChildren } from 'react';

export function DashboardGrid({ children }: PropsWithChildren<unknown>) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
