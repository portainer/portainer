import { Children, PropsWithChildren } from 'react';

export function TableTitleActions({ children }: PropsWithChildren<unknown>) {
  if (Children.count(children) === 0) {
    return null;
  }

  return <div className="settings">{children}</div>;
}
