import { PropsWithChildren } from 'react';

export function TableTitleActions({ children }: PropsWithChildren<unknown>) {
  return <div className="settings">{children}</div>;
}
