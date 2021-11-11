import { PropsWithChildren } from 'react';

export function TableActions({ children }: PropsWithChildren<unknown>) {
  return <div className="actionBar">{children}</div>;
}
